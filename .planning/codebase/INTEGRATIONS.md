# Integrations

## Backend & Authentication
- **Supabase**: Used for Postgres database, authentication (JWT anon keys), and potentially storage. Client initialized via `@supabase/supabase-js`.

## UI Libraries
- **Shadcn UI**: Provides accessible, customizable React components (e.g., `sonner` for toast notifications).
- **Tailwind CSS**: Utility-first CSS framework for styling components.
- **Lucide React**: Icon library used across the dashboard.

## Face Recognition Engine
- **Python / OpenCV / Flask**: A standalone Python-based engine (`/face_engine`) running locally to process camera input, perform face detection/recognition, and communicate with the React frontend via API calls.
