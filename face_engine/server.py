from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import os
os.environ["OPENCV_VIDEOIO_MSMF_ENABLE_HW_TRANSFORMS"] = "0"
import cv2
import pickle
import numpy as np
import os
import threading
import time
import requests as http_requests
from datetime import datetime
from sklearn.neighbors import KNeighborsClassifier

# Load .env manually from the face_engine directory first, then the parent .env
def _load_env(path):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    k, v = line.strip().split('=', 1)
                    if k not in os.environ:
                        os.environ[k] = v.strip('"\'')

_load_env(os.path.join(os.path.dirname(__file__), '.env'))
_load_env(os.path.join(os.path.dirname(__file__), '..', '.env'))

app = Flask(__name__)
CORS(app)

# ── Globals ─────────────────────────────────────────────
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
facedetect = cv2.CascadeClassifier(cascade_path)

# Express backend URL — attendance is logged via the backend, NOT directly to Supabase
EXPRESS_URL = os.environ.get("EXPRESS_BACKEND_URL", "http://localhost:5000")
FACE_ENGINE_SECRET = os.environ.get("FACE_ENGINE_SECRET", "")

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
            # Try Index 0 (Auto - MSMF on Windows, fixed by HW transforms patch)
            print("[face_engine] Attempting to open webcam (Index 0, Auto)...")
            camera = cv2.VideoCapture(0)
            
            # Try Index 0 (DirectShow) as fallback
            if not camera.isOpened():
                print("[face_engine] Auto failed. Attempting Index 0 (DirectShow)...")
                camera = cv2.VideoCapture(0, cv2.CAP_DSHOW)
                
            # Try Index 1 (Auto)
            if not camera.isOpened():
                print("[face_engine] Index 0 failed. Attempting Index 1 (Auto)...")
                camera = cv2.VideoCapture(1)
                
            # Try Index 1 (DirectShow)
            if not camera.isOpened():
                print("[face_engine] Index 1 Auto failed. Attempting Index 1 (DirectShow)...")
                camera = cv2.VideoCapture(1, cv2.CAP_DSHOW)

            if not camera.isOpened():
                print("[face_engine] ERROR: Could not open any webcam. Is it in use by another app?")
            else:
                print("[face_engine] Webcam successfully opened.")
        return camera

def release_camera():
    global camera
    with camera_lock:
        if camera is not None:
            camera.release()
            camera = None

def load_model():
    """Load saved face data from Backend DB (Source of Truth) or local cache, and train KNN."""
    faces = None
    labels = None
    
    # 1. Try to fetch from Express Backend
    try:
        headers = {}
        if FACE_ENGINE_SECRET:
            headers["X-Face-Engine-Secret"] = FACE_ENGINE_SECRET
            
        res = http_requests.get(
            f"{EXPRESS_URL}/api/face/sync",
            headers=headers,
            timeout=5
        )
        if res.status_code == 200:
            data = res.json().get('faces', [])
            if data:
                db_faces = []
                db_labels = []
                for row in data:
                    sbrn = row['sbrn']
                    flat_emb = np.array(row['embedding'], dtype=np.float64)
                    
                    # Ensure it reshapes correctly to (N, 7500)
                    if len(flat_emb) % 7500 == 0:
                        n_samples = len(flat_emb) // 7500
                        reshaped = flat_emb.reshape((n_samples, 7500))
                        db_faces.append(reshaped)
                        db_labels.extend([sbrn] * n_samples)
                
                if db_faces:
                    faces = np.vstack(db_faces)
                    labels = db_labels
                    print(f"[face_engine] Loaded {len(faces)} face samples from DB for {len(set(labels))} students.")
                    
                    # Update local cache
                    data_dir = os.path.join(os.path.dirname(__file__), 'data')
                    os.makedirs(data_dir, exist_ok=True)
                    with open(os.path.join(data_dir, 'names.pkl'), 'wb') as f:
                        pickle.dump(labels, f)
                    with open(os.path.join(data_dir, 'faces_data.npy'), 'wb') as f:
                        np.save(f, faces)
    except Exception as e:
        print(f"[face_engine] Warning: Could not sync from DB: {e}")

    # 2. Fallback to local cache if DB fetch failed
    if faces is None or labels is None:
        try:
            with open('data/names.pkl', 'rb') as f:
                labels = pickle.load(f)
            with open('data/faces_data.npy', 'rb') as f:
                faces = np.load(f)
            print(f"[face_engine] Loaded {len(faces)} face samples from local cache.")
        except Exception:
            return None

    # 3. Train KNN
    try:
        if len(faces) > 0 and len(labels) == len(faces):
            knn = KNeighborsClassifier(n_neighbors=5)
            knn.fit(faces, labels)
            return knn
    except Exception as e:
        print(f"[face_engine] Error training KNN: {e}")
        return None

def log_attendance_via_backend(sbrn, confidence, course_context=None):
    """
    Forward recognized SBRN to the Express backend for secure attendance logging.
    The backend validates the student, prevents duplicates, and writes to Supabase.
    """
    if sbrn in logged_students:
        return

    today = datetime.now().strftime("%Y-%m-%d")
    now_time = datetime.now().strftime("%I:%M:%S %p")

    try:
        headers = {"Content-Type": "application/json"}
        if FACE_ENGINE_SECRET:
            headers["X-Face-Engine-Secret"] = FACE_ENGINE_SECRET

        payload = {
            "sbrn": sbrn,
            "date": today,
            "time": now_time,
            "confidence": round(float(confidence), 2),
        }
        if course_context:
            for key in ("course_id", "course_code", "course_name", "department", "semester"):
                if course_context.get(key):
                    payload[key] = course_context[key]

        res = http_requests.post(
            f"{EXPRESS_URL}/api/attendance/log",
            json=payload,
            headers=headers,
            timeout=5,
        )

        if res.status_code in (200, 201):
            logged_students.add(sbrn)
            data = res.json()
            print(f"[face_engine] Attendance logged: {data.get('student_name', sbrn)} ({sbrn})")
        elif res.status_code == 404:
            # SBRN not found — add to ignore set to avoid spamming backend
            logged_students.add(sbrn)
            print(f"[face_engine] SBRN '{sbrn}' not found in backend — skipping.")
        elif res.status_code == 403:
            logged_students.add(sbrn)
            print(f"[face_engine] Student '{sbrn}' not eligible for attendance: {res.json().get('message')}")
        else:
            print(f"[face_engine] Backend attendance log failed. HTTP {res.status_code}: {res.text[:200]}")
    except http_requests.exceptions.ConnectionError:
        print(f"[face_engine] ERROR: Cannot reach Express backend at {EXPRESS_URL}. Is it running?")
    except Exception as e:
        print(f"[face_engine] log_attendance_via_backend error: {e}")

# ── Video generators ────────────────────────────────────
def gen_scan_frames(course_context=None):
    """Generate MJPEG frames with face recognition overlays."""
    global scan_active, recognized_log
    print(f"[face_engine] Starting scan frames (course: {course_context})")
    knn = load_model()
    cam = get_camera()
    scan_active = True
    recognized_log = []

    try:
        while scan_active:
            with camera_lock:
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
                    # Attendance is now logged via Express backend
                    log_attendance_via_backend(predicted, conf, course_context)
                else:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 255), 2)
                    cv2.putText(frame, "No model", (x, y-10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

            _, buffer = cv2.imencode('.jpg', frame)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
    finally:
        release_camera()

def gen_enroll_frames():
    """Generate MJPEG frames during enrollment capture."""
    global enroll_active, enroll_count, enroll_faces
    cam = get_camera()
    enroll_active = True
    enroll_count = 0
    enroll_faces = []
    frame_i = 0

    try:
        while enroll_active and enroll_count < 100:
            with camera_lock:
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
    finally:
        pass

    # Save face data (only if 100 frames collected)
    if enroll_faces and enroll_name and len(enroll_faces) == 100:
        faces_data = np.asarray(enroll_faces).reshape(len(enroll_faces), -1)
        
        # 1. Update local cache (for immediate availability)
        data_dir = os.path.join(os.path.dirname(__file__), 'data')
        os.makedirs(data_dir, exist_ok=True)

        names_path = os.path.join(data_dir, 'names.pkl')
        faces_path = os.path.join(data_dir, 'faces_data.npy')

        if os.path.exists(names_path):
            with open(names_path, 'rb') as f:
                names = pickle.load(f)
            names = names + [enroll_name] * len(enroll_faces)
        else:
            names = [enroll_name] * len(enroll_faces)

        with open(names_path, 'wb') as f:
            pickle.dump(names, f)

        if os.path.exists(faces_path):
            with open(faces_path, 'rb') as f:
                old = np.load(f)
            new_faces_data = np.append(old, faces_data, axis=0)
        else:
            new_faces_data = faces_data

        with open(faces_path, 'wb') as f:
            np.save(f, new_faces_data)

        print(f"[face_engine] Enrollment saved locally for SBRN: {enroll_name} ({len(enroll_faces)} frames)")
        
        # 2. Sync to Backend DB (Source of Truth)
        try:
            headers = {"Content-Type": "application/json"}
            if FACE_ENGINE_SECRET:
                headers["X-Face-Engine-Secret"] = FACE_ENGINE_SECRET
                
            payload = {
                "sbrn": enroll_name,
                "embedding": faces_data.flatten().tolist(),
                "sample_count": len(enroll_faces)
            }
            
            res = http_requests.post(
                f"{EXPRESS_URL}/api/face/sync",
                json=payload,
                headers=headers,
                timeout=10
            )
            
            if res.status_code == 200:
                print(f"[face_engine] Successfully synced embedding to DB for {enroll_name}")
            else:
                print(f"[face_engine] Warning: Failed to sync DB for {enroll_name}. HTTP {res.status_code}")
                
        except Exception as e:
            print(f"[face_engine] Warning: Error syncing DB for {enroll_name}: {e}")

    enroll_active = False
    release_camera()

# ── Routes ──────────────────────────────────────────────
@app.route('/')
def home():
    return jsonify({
        "status": "running",
        "port": 5001,
        "message": "Face Engine API is live!",
        "express_backend": EXPRESS_URL,
        "endpoints": {
            "GET /video_feed": "MJPEG scan stream for browser",
            "GET /enroll_feed?name=SBRN": "MJPEG enroll stream",
            "GET /recognized": "Get list of recognized students",
            "GET /enroll_status": "Current enrollment progress",
            "POST /stop": "Stop the active camera stream",
        }
    })

@app.route('/video_feed')
def video_feed():
    print("[face_engine] Request received: GET /video_feed")
    course_context = {
        "course_id": request.args.get('course_id'),
        "course_code": request.args.get('course_code'),
        "course_name": request.args.get('course_name'),
        "department": request.args.get('department'),
        "semester": request.args.get('semester'),
    }
    response = Response(gen_scan_frames(course_context),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/enroll_feed')
def enroll_feed():
    print(f"[face_engine] Request received: GET /enroll_feed?name={request.args.get('name')}")
    global enroll_name
    enroll_name = request.args.get('name', 'unknown').upper().strip()
    response = Response(gen_enroll_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/recognized')
def get_recognized():
    return jsonify(recognized_log)

@app.route('/enroll_status')
def enroll_status():
    return jsonify({"count": enroll_count, "active": enroll_active, "name": enroll_name})

@app.route('/stop', methods=['POST'])
def stop():
    global scan_active, enroll_active
    scan_active = False
    enroll_active = False
    release_camera()
    return jsonify({"message": "Camera stopped"})

if __name__ == '__main__':
    print("\n[face_engine] Face Engine API running on http://localhost:5001")
    if facedetect.empty():
        print(f"   WARNING: Haar cascade failed to load from {cascade_path}")
    else:
        print(f"   Haar cascade loaded successfully.")
    print(f"   Express backend: {EXPRESS_URL}")
    print(f"   Secret configured: {'YES' if FACE_ENGINE_SECRET else 'NO'}\n")
    app.run(host='0.0.0.0', port=5001, debug=False, threaded=True)
