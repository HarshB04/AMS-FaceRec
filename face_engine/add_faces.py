import cv2
import pickle
import numpy as np
import os
import sys

# Create data directory if it doesn't exist
if not os.path.exists('data/'):
    os.makedirs('data/')

# Ensure we have access to Haar Cascade using default OpenCV path
facedetect = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

video = cv2.VideoCapture(0)

faces_data = []

i = 0

# If a name was passed in via Flask/Command Line, use it. Otherwise, prompt.
if len(sys.argv) > 1:
    name = sys.argv[1]
else:
    name = input("Enter Student ID or Full Name: ")

while True:
    ret, frame = video.read()
    if not ret:
        print("Camera not found or unavailable")
        break
        
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = facedetect.detectMultiScale(gray, 1.3, 5)
    
    for (x, y, w, h) in faces:
        crop_img = frame[y:y+h, x:x+w, :]
        resized_img = cv2.resize(crop_img, (50, 50))
        
        # Save one out of every 10 frames to get a good distribution
        if len(faces_data) < 100 and i % 10 == 0:
            faces_data.append(resized_img)
            
        i = i + 1
        
        cv2.putText(frame, str(len(faces_data)), (50, 50), cv2.FONT_HERSHEY_COMPLEX, 1, (50, 50, 255), 1)
        cv2.rectangle(frame, (x, y), (x+w, y+h), (50, 50, 255), 1)
        
    cv2.imshow("Capture Frame", frame)
    
    # Hit 'q' to quit early, or automatically stop when we collect 100 images
    k = cv2.waitKey(1)
    if k == ord('q') or len(faces_data) == 100:
        break

video.release()
cv2.destroyAllWindows()

# Process data
faces_data = np.asarray(faces_data)
faces_data = faces_data.reshape(100, -1) # Flatten

# Handle names
if 'names.pkl' not in os.listdir('data/'):
    names = [name] * 100
    with open('data/names.pkl', 'wb') as f:
        pickle.dump(names, f)
else:
    with open('data/names.pkl', 'rb') as f:
        names = pickle.load(f)
    names = names + [name] * 100
    with open('data/names.pkl', 'wb') as f:
        pickle.dump(names, f)

# Handle faces
if 'faces_data.npy' not in os.listdir('data/'):
    with open('data/faces_data.npy', 'wb') as f:
        np.save(f, faces_data)
else:
    with open('data/faces_data.npy', 'rb') as f:
        faces = np.load(f)
    faces = np.append(faces, faces_data, axis=0)
    with open('data/faces_data.npy', 'wb') as f:
        np.save(f, faces)

print(f"✅ Successfully captured and saved facial data for {name}")
