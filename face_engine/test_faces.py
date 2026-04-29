import cv2
import pickle
import numpy as np
import os
import time
import requests
from datetime import datetime
from sklearn.neighbors import KNeighborsClassifier

# --- Configuration & Env Vars ---
# Load .env manually if it exists in parent dir
env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
if os.path.exists(env_path):
    with open(env_path) as f:
        for line in f:
            if line.strip() and not line.startswith('#') and '=' in line:
                k, v = line.strip().split('=', 1)
                if k not in os.environ:
                    os.environ[k] = v.strip('"\'')

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

# --- OpenCV Initialization ---
facedetect = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Load stored data
try:
    with open('data/names.pkl', 'rb') as f:
        LABELS = pickle.load(f)
    with open('data/faces_data.npy', 'rb') as f:
        FACES = np.load(f)
except Exception as e:
    print("Data files not found. Run add_faces.py first to register a user.")
    exit()

# Ensure data consistency
if len(FACES) != len(LABELS):
    print(f"Data corruption detected! FACES length ({len(FACES)}) does not match LABELS length ({len(LABELS)}).")
    print("Please delete the 'data' folder contents and re-enroll users.")
    exit()

# Train KNN Model
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(FACES, LABELS)

print("Model trained locally with KNN. Firing up camera...")
video = cv2.VideoCapture(0)

# Track who we logged today
logged_students = set()

def log_attendance(student_identifier):
    """
    Looks up the student by their name or ID in the DB, 
    and inserts a 'present' record for today.
    """
    today_date = datetime.now().strftime("%Y-%m-%d")
    
    if student_identifier in logged_students:
        return
        
    print(f"Looking up student: {student_identifier} in database...")
    
    try:
        # Match by name
        res = requests.get(f"{SUPABASE_URL}/rest/v1/students?name=eq.{student_identifier}&select=id,course", headers=HEADERS)
        data = res.json()
        
        # Match by student_id text if name fails
        if not data:
            res = requests.get(f"{SUPABASE_URL}/rest/v1/students?student_id_text=eq.{student_identifier}&select=id,course", headers=HEADERS)
            data = res.json()
            
        if not data:
            print(f"Could not find {student_identifier} in the database. Cannot log attendance.")
            logged_students.add(student_identifier)
            return

        student = data[0]
        db_student_id = student['id']
        course_name = student.get('course', '')
        
        # Get Course ID
        res_course = requests.get(f"{SUPABASE_URL}/rest/v1/courses?course_name=eq.{course_name}&select=id", headers=HEADERS)
        c_data = res_course.json()
        course_id = c_data[0]['id'] if c_data else None
        
        print(f"Marking '{student_identifier}' as present...")
        
        # Log attendance
        attendance_payload = {
            "student_id": db_student_id,
            "status": "present",
            "date_attended": today_date
        }
        if course_id:
            attendance_payload["course_id"] = course_id
            
        requests.post(f"{SUPABASE_URL}/rest/v1/attendance", headers=HEADERS, json=attendance_payload)
        
        print(f"Success! Attendance saved to Supabase for {student_identifier}.")
        logged_students.add(student_identifier)
        
    except Exception as e:
        print(f"Supabase Sync Error: {e}")

# Live Webcam Loop
while True:
    ret, frame = video.read()
    if not ret:
        print("Camera not found or unavailable")
        break
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = facedetect.detectMultiScale(gray, 1.3, 5)
    
    for (x, y, w, h) in faces:
        crop_img = frame[y:y+h, x:x+w, :]
        resized_img = cv2.resize(crop_img, (50, 50)).flatten().reshape(1, -1)
            
        output = knn.predict(resized_img)
        predicted_name = str(output[0])
        
        cv2.putText(frame, predicted_name, (x, y-15), cv2.FONT_HERSHEY_COMPLEX, 1, (255, 255, 255), 1)
        cv2.rectangle(frame, (x, y), (x+w, y+h), (50, 50, 255), 1)
        
        log_attendance(predicted_name)
        
    cv2.imshow("Scanner Output", frame)
    
    k = cv2.waitKey(1)
    if k == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
