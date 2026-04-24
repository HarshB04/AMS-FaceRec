import cv2
import pickle
import numpy as np
import os
import time
from sklearn.neighbors import KNeighborsClassifier

# Set working directory to parent conceptually, or use absolute path
# Since this script is inside 'test', data is in '../data'
DATA_DIR = os.path.join(os.path.dirname(__file__), '..', 'data')

# --- OpenCV Initialization ---
cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
facedetect = cv2.CascadeClassifier(cascade_path)

# Load stored data
try:
    names_path = os.path.join(DATA_DIR, 'names.pkl')
    faces_path = os.path.join(DATA_DIR, 'faces_data.npy')
    
    with open(names_path, 'rb') as f:
        LABELS = pickle.load(f)
    with open(faces_path, 'rb') as f:
        FACES = np.load(f)
except Exception as e:
    print(f"❌ Data files not found at {DATA_DIR}. Make sure you have enrolled a student through the dashboard first.")
    exit()

# Train KNN Model
print("Training KNN Model on local data...")
knn = KNeighborsClassifier(n_neighbors=5)
knn.fit(FACES, LABELS)

print("✅ Model trained locally. Firing up camera for independent testing...")
print("Press 'q' inside the video window to quit.")
video = cv2.VideoCapture(0)

# Track last print time to avoid spamming the console
last_print_time = 0

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
        
        # Only print once every second so console isn't flooded
        current_time = time.time()
        if current_time - last_print_time > 1.0:
            print(f"🔍 Face Detected: {predicted_name}")
            last_print_time = current_time
        
    cv2.imshow("Independent Face Scanner Tester", frame)
    
    k = cv2.waitKey(1)
    if k == ord('q'):
        break

video.release()
cv2.destroyAllWindows()
