# Phase 4 UAT: Teacher Live Dashboard

## Verification Steps
1. Navigate to `/teacher/classes` (Teacher Dashboard -> Classes).
2. Verify that the assigned courses load and display.
3. Click "View student roster" on a course card to ensure the roster expands and shows actual student data (no dummy data).
4. Click "Start Scan" on a course card.
5. Verify it routes to `/teacher/camera?course=COURSE_NAME`.
6. Verify the Live Camera dashboard shows the correct "Enrolled" student count for that course.
7. Verify the dropdown defaults to the correct course.
8. Verify clicking "Start Scanning" enables the webcam view (this may not work in automated headless mode, but the UI state should indicate scanning).
