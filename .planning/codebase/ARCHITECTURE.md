# Architecture

## High-Level Overview
The project is a client-server web application with a standalone local ML engine.

1. **Frontend (Vite + React)**:
   - Single Page Application (SPA) architecture.
   - Client-side routing for dashboard navigation (e.g., `/dashboard`, `/login`).
   - Protected routes implemented via an `AuthGuard` component wrapping dashboard layouts.

2. **Backend Services (Supabase)**:
   - Provides serverless infrastructure for PostgreSQL database operations.
   - Handles user session management and authentication.

3. **Face Recognition Engine**:
   - Local Python service exposing a Flask API.
   - The React frontend communicates with this local engine to trigger camera enrollment and live scanning workflows.

## State & Data Flow
- Authentication state dictates route access (student vs admin/teacher views).
- Attendance logs are captured by the Face Engine and synced to Supabase, which the frontend then queries and displays.
