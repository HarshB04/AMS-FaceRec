from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import cv2
import pickle
import numpy as np
import os
import threading
import time
import requests as http_requests
from datetime import datetime
from urllib.parse import quote
from sklearn.neighbors import KNeighborsClassifier

# Load .env manually if it exists in parent dir
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                k, v = line.strip().split('=', 1)
                if k not in os.environ:
                    os.environ[k] = v.strip('"\'')

app = Flask(__name__)
CORS(app)

# ── Globals ─────────────────────────────────────────────
facedetect = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Supabase config
SUPABASE_URL = os.environ.get("VITE_SUPABASE_URL", "https://lngcsgcqtwdgyrvmykhy.supabase.co")
SUPABASE_KEY = os.environ.get("VITE_SUPABASE_PUBLISHABLE_KEY")

if not SUPABASE_KEY:
    raise ValueError("VITE_SUPABASE_PUBLISHABLE_KEY environment variable is missing. Please set it in the root .env file.")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

# Shared state
camera = None
camera_lock = threading.Lock()
scan_active = False
enroll_active = False
enroll_name = ""
enroll_count = 0
enroll_faces = []
recognized_log = []       # [{name, time, confidence}]
logged_students = set()

# ── Helpers ─────────────────────────────────────────────
def get_camera():
    global camera
    with camera_lock:
        if camera is None or not camera.isOpened():
            print("Attempting to open webcam on Windows (using DirectShow)...")
            camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
            if not camera.isOpened():
                print("ERROR: Could not open webcam 0. Is it in use by another app?")
            else:
                print("Webcam successfully opened.")
        return camera

def release_camera():
    global camera
    with camera_lock:
        if camera is not None:
            camera.release()
            camera = None

def load_model():
    """Load saved face data and train KNN."""
    try:
        with open('data/names.pkl', 'rb') as f:
            labels = pickle.load(f)
        with open('data/faces_data.npy', 'rb') as f:
            faces = np.load(f)
        knn = KNeighborsClassifier(n_neighbors=5)
        knn.fit(faces, labels)
        return knn
    except Exception:
        return None

def log_attendance(name):
    """Log attendance to Supabase."""
    today = datetime.now().strftime("%Y-%m-%d")
    if name in logged_students:
        return
    try:
        encoded_name = quote(name)
        res = http_requests.get(f"{SUPABASE_URL}/rest/v1/students?name=eq.{encoded_name}&select=id,course", headers=HEADERS)
        data = res.json()
        if not data:
            res = http_requests.get(f"{SUPABASE_URL}/rest/v1/students?student_id_text=eq.{encoded_name}&select=id,course", headers=HEADERS)
            data = res.json()
        if not data:
            logged_students.add(name)
            return
        student = data[0]
        payload = {"student_id": student['id'], "status": "present", "date_attended": today}
        course_name = student.get('course', '')
        if course_name:
            cr = http_requests.get(f"{SUPABASE_URL}/rest/v1/courses?course_name=eq.{quote(course_name)}&select=id", headers=HEADERS)
            cd = cr.json()
            if cd:
                payload["course_id"] = cd[0]['id']
        post_res = http_requests.post(f"{SUPABASE_URL}/rest/v1/attendance", headers=HEADERS, json=payload)
        
        # If successfully logged or uniquely constrained (409 Conflict)
        if post_res.status_code in (200, 201, 204, 409):
            logged_students.add(name)
        else:
            print(f"Failed to log attendance. HTTP {post_res.status_code}: {post_res.text}")
    except Exception as e:
        print(f"DB error: {e}")

# ── Video generators ────────────────────────────────────
def gen_scan_frames():
    """Generate MJPEG frames with face recognition overlays."""
    global scan_active, recognized_log
    knn = load_model()
    cam = get_camera()
    scan_active = True
    recognized_log = []

    while scan_active:
        ret, frame = cam.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = facedetect.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            if knn is not None:
                crop = frame[y:y+h, x:x+w, :]
                resized = cv2.resize(crop, (50, 50)).flatten().reshape(1, -1)
                output = knn.predict(resized)
                predicted = str(output[0])
                # confidence via distance
                dist, _ = knn.kneighbors(resized, n_neighbors=1)
                conf = max(0, min(100, 100 - dist[0][0]))

                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
                cv2.putText(frame, f"{predicted} ({conf:.0f}%)", (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)

                if predicted not in [r['name'] for r in recognized_log]:
                    recognized_log.append({
                        "name": predicted,
                        "time": datetime.now().strftime("%I:%M:%S %p"),
                        "confidence": round(conf, 1)
                    })
                log_attendance(predicted)
            else:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                cv2.putText(frame, "No model", (x, y-10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    release_camera()

def gen_enroll_frames():
    """Generate MJPEG frames during enrollment capture."""
    global enroll_active, enroll_count, enroll_faces
    cam = get_camera()
    enroll_active = True
    enroll_count = 0
    enroll_faces = []
    frame_i = 0

    while enroll_active and enroll_count < 100:
        ret, frame = cam.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = facedetect.detectMultiScale(gray, 1.3, 5)

        for (x, y, w, h) in faces:
            crop = frame[y:y+h, x:x+w, :]
            resized = cv2.resize(crop, (50, 50))

            if frame_i % 10 == 0 and enroll_count < 100:
                enroll_faces.append(resized)
                enroll_count += 1

            cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 165, 0), 2)
            cv2.putText(frame, f"Capturing {enroll_count}/100", (x, y-10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 165, 0), 2)
        frame_i += 1

        _, buffer = cv2.imencode('.jpg', frame)
        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

    # Save the data when done
    if enroll_faces and enroll_name:
        faces_data = np.asarray(enroll_faces).reshape(len(enroll_faces), -1)
        if not os.path.exists('data/'):
            os.makedirs('data/')

        # Names
        if 'names.pkl' in os.listdir('data/'):
            with open('data/names.pkl', 'rb') as f:
                names = pickle.load(f)
            names = names + [enroll_name] * len(enroll_faces)
        else:
            names = [enroll_name] * len(enroll_faces)
        with open('data/names.pkl', 'wb') as f:
            pickle.dump(names, f)

        # Faces
        if 'faces_data.npy' in os.listdir('data/'):
            with open('data/faces_data.npy', 'rb') as f:
                old = np.load(f)
            faces_data = np.append(old, faces_data, axis=0)
        with open('data/faces_data.npy', 'wb') as f:
            np.save(f, faces_data)

    enroll_active = False
    release_camera()

# ── Routes ──────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "status": "running",
        "message": "Face Engine API is live!",
        "endpoints": {
            "GET /video_feed": "MJPEG scan stream for browser",
            "GET /enroll_feed?name=X": "MJPEG enroll stream for browser",
            "GET /recognized": "Get list of recognized students",
            "POST /stop": "Stop the active camera stream"
        }
    })

@app.route('/video_feed')
def video_feed():
    """Stream live scanning feed as MJPEG — embed as <img src> in React."""
    return Response(gen_scan_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/enroll_feed')
def enroll_feed():
    """Stream enrollment capture as MJPEG — embed as <img src> in React."""
    global enroll_name
    enroll_name = request.args.get('name', 'unknown')
    return Response(gen_enroll_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/recognized')
def get_recognized():
    """Return list of students recognized so far this session."""
    return jsonify(recognized_log)

@app.route('/enroll_status')
def enroll_status():
    """Return enrollment progress."""
    return jsonify({"count": enroll_count, "active": enroll_active, "name": enroll_name})

@app.route('/stop', methods=['POST'])
def stop():
    """Stop any active camera stream."""
    global scan_active, enroll_active
    scan_active = False
    enroll_active = False
    release_camera()
    return jsonify({"message": "Camera stopped"})

if __name__ == '__main__':
    print("Face Engine API running on http://localhost:5000")
    app.run(port=5000, debug=False, threaded=True)
