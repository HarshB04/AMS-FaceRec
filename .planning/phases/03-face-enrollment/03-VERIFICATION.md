# Phase 3 Verification Plan: Face Enrollment Workflow

This document outlines the User Acceptance Testing (UAT) steps required to manually verify that Phase 3 meets all business requirements and `must_haves`.

## Requirements to Verify
- **ADMIN-05**: Admin-led in-person face enrollment process via local Python engine.
- **Resilience**: Frontend gracefully alerts the user if the backend is down.

## Test Environment Setup
1. Ensure the Vite dev server is running (`npm run dev`) in the root directory.
2. In a separate terminal, navigate to `face_engine`, activate the virtual environment, and run the Python server (`py .\server.py`).
3. Log into the application at `http://localhost:5173` using an account with the **Admin** role.

---

## Scenario 1: Python Engine Unreachable Error State
**Objective**: Verify the application handles the Python server being offline gracefully.

*   [ ] Stop the `server.py` process if it is currently running.
*   [ ] **Navigate** to "Students" via the sidebar.
*   [ ] Click "Add Student". Enter a dummy first name.
*   [ ] Click "Capture Face Data".
*   [ ] **Verify** that a standard alert pops up saying: *"Python Face Engine is not running. Please start the server on port 5000."*

## Scenario 2: Admin-Led Face Enrollment
**Objective**: Verify the admin can successfully enroll a student face.

*   [ ] Start the `server.py` process again in the `face_engine` directory.
*   [ ] Back in the web UI, ensure you are still in the "Add Student" modal with a name filled out.
*   [ ] Click "Capture Face Data".
*   [ ] **Verify** the modal UI updates to show the live camera feed and prompts the user to look at the camera.
*   [ ] **Verify** the Python camera script saves the captured frames and the UI toggles to "Face Data Captured! ✓" after reaching 100 frames.

## Sign-off
If all scenarios pass, Phase 3 is complete and verified. You may proceed to plan the next phase in `.planning/ROADMAP.md`!
