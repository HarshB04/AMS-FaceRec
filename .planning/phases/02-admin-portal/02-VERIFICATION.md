# Phase 2 Verification Plan: Admin Portal Core

This document outlines the User Acceptance Testing (UAT) steps required to manually verify that Phase 2 meets all business requirements and `must_haves`.

## Requirements to Verify
- **ADMIN-01**: Admin can view, create, edit, and delete Student records.
- **ADMIN-02**: Admin can view, create, edit, and delete Course records.
- **ADMIN-03**: Admin can view, create, edit, and delete Instructor records.
- **ADMIN-04**: Admin can enroll students into specific courses.
- **UI Contract**: Interfaces strictly use Shadcn components matching `02-UI-SPEC.md`.

## Test Environment Setup
1. Ensure Supabase is running and accessible (or your local Supabase instance is active).
2. Ensure the Vite dev server is running (`npm run dev`).
3. Log into the application at `http://localhost:5173` using an account with the **Admin** role.

---

## Scenario 1: Student Management CRUD
**Objective**: Verify the Student dashboard operates perfectly with the database.

*   [ ] **Navigate** to "Students" via the sidebar.
*   [ ] **Create**: Click "Add Student", fill out the Shadcn Dialog form (Name, Email, SBRN, Course), and save. Verify the student appears in the Table.
*   [ ] **Edit**: Click the "Edit" (pencil) icon on the newly created student. Change their name or course, save, and verify the Table updates immediately.
*   [ ] **Delete**: Click the "Delete" (trash) icon. Confirm the deletion in the alert dialog. Verify the student is removed from the Table.
*   [ ] **UI Verification**: Ensure the page uses the `geist` font, uses Shadcn tables and dialogs, and matches the blue/slate aesthetic.

## Scenario 2: Instructor Management CRUD
**Objective**: Verify the Teacher dashboard operates perfectly with the database.

*   [ ] **Navigate** to "Teachers/Instructors" via the sidebar.
*   [ ] **Create**: Click "Add Teacher", fill out the Shadcn form (Name, Email), and save. Verify the teacher appears in the Table.
*   [ ] **Edit**: Edit the teacher's email, save, and verify the Table updates.
*   [ ] **Delete**: Delete the teacher. Verify they are removed from the Table.

## Scenario 3: Course Management CRUD & Enrollment
**Objective**: Verify Courses can be managed and students can be enrolled.

*   [ ] **Navigate** to "Courses" via the sidebar.
*   [ ] **Create**: Click "Add Course", fill out the form (Code, Name, Status, Instructor), and save.
*   [ ] **Enrollment Workflow**:
    1. Click the **"Enroll"** button next to a specific course.
    2. A dialog should open listing all registered students.
    3. Click the "Enroll" action next to a student. The UI should instantly toggle to "Enrolled" (green button).
    4. Close the dialog.
    5. Navigate back to the **Students** tab and verify that the student's `Course` column has been updated to match the course you just enrolled them in.

## Sign-off
If all scenarios pass, Phase 2 is complete and verified. You may proceed to plan the next phase in `.planning/ROADMAP.md`!
