import os
import sys
import pickle
import numpy as np
import requests

# Set up to read the backend .env
def load_env(path):
    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                if line.strip() and not line.startswith('#') and '=' in line:
                    k, v = line.strip().split('=', 1)
                    if k not in os.environ:
                        os.environ[k] = v.strip('"\'')

# Load backend env for SUPABASE_URL and SUPABASE_SERVICE_ROLE
load_env(os.path.join(os.path.dirname(__file__), '..', 'backend', '.env'))

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE") or os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in backend/.env.")
    sys.exit(1)

def migrate_faces():
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    names_path = os.path.join(data_dir, 'names.pkl')
    faces_path = os.path.join(data_dir, 'faces_data.npy')

    if not os.path.exists(names_path) or not os.path.exists(faces_path):
        print("No face data found to migrate.")
        return

    with open(names_path, 'rb') as f:
        names = pickle.load(f)
    
    with open(faces_path, 'rb') as f:
        faces = np.load(f)

    if len(names) != len(faces):
        print(f"Error: names length ({len(names)}) does not match faces length ({len(faces)}).")
        sys.exit(1)

    print(f"Loaded {len(names)} total frames from numpy array.")

    # Group faces by SBRN
    # In the new schema, face_embeddings references user_id. We need to resolve SBRN -> user_id
    grouped_faces = {}
    for i, sbrn in enumerate(names):
        if sbrn not in grouped_faces:
            grouped_faces[sbrn] = []
        grouped_faces[sbrn].append(faces[i])

    print(f"Found {len(grouped_faces)} unique students.")

    # Supabase REST headers
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal"
    }

    # Helper function to get user_id from student_details using SBRN
    def get_user_id(sbrn):
        res = requests.get(
            f"{SUPABASE_URL}/rest/v1/student_details?sbrn=eq.{sbrn}&select=user_id",
            headers=headers
        )
        if res.status_code == 200 and len(res.json()) > 0:
            return res.json()[0]['user_id']
        return None

    for sbrn, frames in grouped_faces.items():
        print(f"Migrating {sbrn} ({len(frames)} frames)...")
        user_id = get_user_id(sbrn)
        
        if not user_id:
            print(f"  Warning: No student found with SBRN '{sbrn}'. Skipping.")
            continue

        # Convert numpy array to list of floats
        # Each frame is 7500 floats. The total array for a student is 100 * 7500 = 750,000 floats
        flat_embedding = np.asarray(frames).flatten().tolist()
        
        # We need to insert a single row per user with the flat embedding array
        # First, delete any existing row for this user to avoid duplicates if re-run
        requests.delete(
            f"{SUPABASE_URL}/rest/v1/face_embeddings?user_id=eq.{user_id}",
            headers=headers
        )

        payload = {
            "user_id": user_id,
            "embedding": flat_embedding,
            "sample_count": len(frames),
            "model_version": "haar_knn_v1"
        }

        res = requests.post(
            f"{SUPABASE_URL}/rest/v1/face_embeddings",
            headers=headers,
            json=payload
        )

        if res.status_code in (200, 201):
            print(f"  Success: Uploaded embeddings for {sbrn}")
        else:
            print(f"  Error: Failed to upload embeddings for {sbrn}. Code: {res.status_code}")
            print(res.text[:200])

if __name__ == "__main__":
    migrate_faces()
