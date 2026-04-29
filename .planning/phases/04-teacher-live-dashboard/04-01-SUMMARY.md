# Plan 04-01 Summary: Teacher Course List View

**Status:** Completed
**Date:** 2026-04-29

## Work Completed

1. **API Updates (`api.ts`)**:
   - Added `getStudentsByCourse(courseName: string)` to fetch actual student records from Supabase where `course` matches the `courseName`.

2. **UI Updates (`TeacherClasses.tsx`)**:
   - Removed the dummy `ROSTER` and `rosterFor` utility functions.
   - Refactored `<ClassCard />` to maintain its own `roster` state, fetching the enrolled students dynamically via `getStudentsByCourse` when the accordion is expanded.
   - Correctly hooked up the table to render `studentId`, `name`, and their actual database `attendance` record.
   - Correctly parameterized the "Start Scan" `<Link>` to pass `course.name` rather than `course.code` to ensure `LiveCamera` operates on the same identifier.

## Output
The `TeacherClasses` view is no longer reliant on dummy data and fully integrates with the Supabase schema to accurately show which students are enrolled in the active courses.
