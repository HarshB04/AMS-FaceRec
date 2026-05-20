-- ============================================================================
-- Seed: Demo Data — Indian Institute (ABVGIET-style)
-- Students, Courses, and Attendance for all 4 branches × 6 semesters.
-- Safe to re-run: uses ON CONFLICT DO NOTHING everywhere.
-- ============================================================================

-- ── COURSES ───────────────────────────────────────────────────────────────────
-- Computer Engineering (CE)
INSERT INTO public.courses (source_key, source, department, branch, semester, course_name, course_code, teacher, schedule, room, student_count, status) VALUES
  ('manual:CE-I-MP',    'manual', 'Computer Engineering', 'Computer Engineering', 'I',   'Mathematics – I (Calculus & Linear Algebra)', 'BSC-101', 'Dr. Arvind Sharma',    'Mon/Wed 9:00–10:00',  'Room 101', 60, 'active'),
  ('manual:CE-I-PH',    'manual', 'Computer Engineering', 'Computer Engineering', 'I',   'Engineering Physics',                         'BSC-103', 'Prof. Meena Joshi',    'Tue/Thu 10:00–11:00', 'Room 102', 60, 'active'),
  ('manual:CE-I-BCSL',  'manual', 'Computer Engineering', 'Computer Engineering', 'I',   'Basic Computer Skills Lab',                   'CE-191',  'Prof. Rahul Chauhan',  'Fri 2:00–5:00',       'Lab-A',    60, 'active'),
  ('manual:CE-II-DS',   'manual', 'Computer Engineering', 'Computer Engineering', 'II',  'Data Structures',                             'CE-201',  'Dr. Sunita Verma',     'Mon/Wed 9:00–10:00',  'Room 103', 55, 'active'),
  ('manual:CE-II-OOP',  'manual', 'Computer Engineering', 'Computer Engineering', 'II',  'Object Oriented Programming (C++)',           'CE-203',  'Prof. Nitin Gupta',    'Tue/Thu 11:00–12:00', 'Room 104', 55, 'active'),
  ('manual:CE-III-DBMS','manual', 'Computer Engineering', 'Computer Engineering', 'III', 'Database Management Systems',                 'CE-301',  'Dr. Priya Kapoor',     'Mon/Wed 10:00–11:00', 'Room 201', 52, 'active'),
  ('manual:CE-III-OS',  'manual', 'Computer Engineering', 'Computer Engineering', 'III', 'Operating Systems',                           'CE-303',  'Prof. Deepak Mishra',  'Tue/Thu 9:00–10:00',  'Room 202', 52, 'active'),
  ('manual:CE-IV-CN',   'manual', 'Computer Engineering', 'Computer Engineering', 'IV',  'Computer Networks',                           'CE-401',  'Dr. Vandana Singh',    'Mon/Wed 11:00–12:00', 'Room 203', 50, 'active'),
  ('manual:CE-IV-SE',   'manual', 'Computer Engineering', 'Computer Engineering', 'IV',  'Software Engineering',                        'CE-403',  'Prof. Arun Saxena',    'Tue/Thu 10:00–11:00', 'Room 204', 50, 'active'),
  ('manual:CE-V-AI',    'manual', 'Computer Engineering', 'Computer Engineering', 'V',   'Artificial Intelligence',                     'CE-501',  'Dr. Kavita Yadav',     'Mon/Wed 9:00–10:00',  'Room 301', 48, 'active'),
  ('manual:CE-V-WD',    'manual', 'Computer Engineering', 'Computer Engineering', 'V',   'Web Development (Full Stack)',                'CE-503',  'Prof. Rohit Tiwari',   'Tue/Thu 2:00–3:00',   'Lab-B',    48, 'active'),
  ('manual:CE-VI-ML',   'manual', 'Computer Engineering', 'Computer Engineering', 'VI',  'Machine Learning',                            'CE-601',  'Dr. Anita Dubey',      'Mon/Wed 10:00–11:00', 'Room 302', 45, 'active'),
  ('manual:CE-VI-PROJ', 'manual', 'Computer Engineering', 'Computer Engineering', 'VI',  'Major Project & Seminar',                     'CE-691',  'Dr. Arvind Sharma',    'Fri 9:00–12:00',      'Lab-C',    45, 'active')
ON CONFLICT (source_key) DO NOTHING;

-- Electrical Engineering (EE)
INSERT INTO public.courses (source_key, source, department, branch, semester, course_name, course_code, teacher, schedule, room, student_count, status) VALUES
  ('manual:EE-I-BEE',   'manual', 'Electrical Engineering', 'Electrical Engineering', 'I',   'Basic Electrical Engineering',                'EE-101',  'Prof. Girish Pandey',  'Mon/Wed 9:00–10:00',  'Room 105', 58, 'active'),
  ('manual:EE-II-EM',   'manual', 'Electrical Engineering', 'Electrical Engineering', 'II',  'Electro-Magnetic Fields',                     'EE-201',  'Dr. Rekha Srivastava', 'Tue/Thu 11:00–12:00', 'Room 106', 56, 'active'),
  ('manual:EE-III-PE',  'manual', 'Electrical Engineering', 'Electrical Engineering', 'III', 'Power Electronics',                           'EE-301',  'Prof. Suresh Kumar',   'Mon/Wed 10:00–11:00', 'Room 205', 54, 'active'),
  ('manual:EE-IV-PSD',  'manual', 'Electrical Engineering', 'Electrical Engineering', 'IV',  'Power System Design',                         'EE-401',  'Dr. Asha Tripathi',    'Mon/Wed 11:00–12:00', 'Room 206', 52, 'active'),
  ('manual:EE-V-CS',    'manual', 'Electrical Engineering', 'Electrical Engineering', 'V',   'Control Systems',                             'EE-501',  'Prof. Manoj Tiwari',   'Tue/Thu 9:00–10:00',  'Room 303', 50, 'active'),
  ('manual:EE-VI-PROJ', 'manual', 'Electrical Engineering', 'Electrical Engineering', 'VI',  'Major Project',                               'EE-691',  'Dr. Rekha Srivastava', 'Fri 9:00–12:00',      'Lab-D',    47, 'active')
ON CONFLICT (source_key) DO NOTHING;

-- Mechanical Engineering (ME)
INSERT INTO public.courses (source_key, source, department, branch, semester, course_name, course_code, teacher, schedule, room, student_count, status) VALUES
  ('manual:ME-I-EDC',   'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'I',   'Engineering Drawing & CAD',                   'ME-101',  'Prof. Brijesh Sharma', 'Mon/Wed 9:00–10:00',  'Drawing Hall', 62, 'active'),
  ('manual:ME-II-TOM',  'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'II',  'Theory of Machines',                          'ME-201',  'Dr. Harish Verma',     'Tue/Thu 10:00–11:00', 'Room 107', 60, 'active'),
  ('manual:ME-III-HT',  'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'III', 'Heat Transfer',                               'ME-301',  'Prof. Shyam Prasad',   'Mon/Wed 11:00–12:00', 'Room 207', 58, 'active'),
  ('manual:ME-IV-MFP',  'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'IV',  'Manufacturing Processes',                     'ME-401',  'Dr. Rakesh Yadav',     'Tue/Thu 2:00–3:00',   'Workshop',     56, 'active'),
  ('manual:ME-V-IC',    'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'V',   'Internal Combustion Engines',                 'ME-501',  'Prof. Dinesh Pathak',  'Mon/Wed 9:00–10:00',  'Room 304', 54, 'active'),
  ('manual:ME-VI-PROJ', 'manual', 'Mechanical Engineering', 'Mechanical Engineering', 'VI',  'Major Project',                               'ME-691',  'Dr. Harish Verma',     'Fri 9:00–12:00',      'Workshop',     50, 'active')
ON CONFLICT (source_key) DO NOTHING;

-- Electronics & Communication Engineering (ECE)
INSERT INTO public.courses (source_key, source, department, branch, semester, course_name, course_code, teacher, schedule, room, student_count, status) VALUES
  ('manual:ECE-I-EST',  'manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'I',   'Elements of Electronics',                     'ECE-101', 'Dr. Pradeep Bajpai',   'Mon/Wed 9:00–10:00',  'Room 108', 60, 'active'),
  ('manual:ECE-II-EDC', 'manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'II',  'Electronic Devices & Circuits',               'ECE-201', 'Prof. Savita Sharma',  'Tue/Thu 11:00–12:00', 'Room 109', 58, 'active'),
  ('manual:ECE-III-SS', 'manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'III', 'Signals & Systems',                           'ECE-301', 'Dr. Anil Rastogi',     'Mon/Wed 10:00–11:00', 'Room 208', 56, 'active'),
  ('manual:ECE-IV-DC',  'manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'IV',  'Digital Communication',                       'ECE-401', 'Prof. Meera Sehgal',   'Tue/Thu 9:00–10:00',  'Room 209', 54, 'active'),
  ('manual:ECE-V-VLSI', 'manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'V',   'VLSI Design',                                 'ECE-501', 'Dr. Pankaj Agrawal',   'Mon/Wed 11:00–12:00', 'Room 305', 52, 'active'),
  ('manual:ECE-VI-PROJ','manual', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'VI',  'Major Project',                               'ECE-691', 'Dr. Pradeep Bajpai',   'Fri 9:00–12:00',      'Lab-E',    48, 'active')
ON CONFLICT (source_key) DO NOTHING;

-- ── STUDENTS ──────────────────────────────────────────────────────────────────
-- Computer Engineering students (mix of semesters)
INSERT INTO public.students (student_id_text, name, email, course, branch, department, semester, session, status, face_enrolled, attendance_rate, registration_date) VALUES
  -- Semester III (Session 2024 - 2027)
  ('2024CE001', 'Aarav Kumar Sharma',        'aarav.sharma@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 82.5, '2024-08-05'),
  ('2024CE002', 'Priya Verma',               'priya.verma@abvgiet.ac.in',        'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 91.0, '2024-08-05'),
  ('2024CE003', 'Rohan Singh Chauhan',       'rohan.chauhan@abvgiet.ac.in',      'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 76.3, '2024-08-05'),
  ('2024CE004', 'Anjali Gupta',              'anjali.gupta@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 88.0, '2024-08-05'),
  ('2024CE005', 'Vikram Yadav',              'vikram.yadav@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 65.5, '2024-08-06'),
  ('2024CE006', 'Sneha Pandey',              'sneha.pandey@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 95.2, '2024-08-06'),
  ('2024CE007', 'Karan Mehta',               'karan.mehta@abvgiet.ac.in',        'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 78.1, '2024-08-06'),
  ('2024CE008', 'Divya Mishra',              'divya.mishra@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 83.7, '2024-08-07'),
  ('2024CE009', 'Arjun Tiwari',              'arjun.tiwari@abvgiet.ac.in',       'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 72.4, '2024-08-07'),
  ('2024CE010', 'Riya Joshi',                'riya.joshi@abvgiet.ac.in',         'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 3, '2024 - 2027', 'active', false, 89.6, '2024-08-07'),
  -- Semester V (Session 2023 - 2026)
  ('2023CE001', 'Harsh Bhawani',             'harsh.bhawani@abvgiet.ac.in',      'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 5, '2023 - 2026', 'active', true,  90.0, '2023-08-04'),
  ('2023CE002', 'Tanvi Dubey',               'tanvi.dubey@abvgiet.ac.in',        'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 5, '2023 - 2026', 'active', false, 84.5, '2023-08-04'),
  ('2023CE003', 'Siddharth Rajput',          'siddharth.rajput@abvgiet.ac.in',   'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 5, '2023 - 2026', 'active', false, 79.3, '2023-08-05'),
  ('2023CE004', 'Nandini Shukla',            'nandini.shukla@abvgiet.ac.in',     'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 5, '2023 - 2026', 'active', false, 93.1, '2023-08-05'),
  ('2023CE005', 'Abhishek Patel',            'abhishek.patel@abvgiet.ac.in',     'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 5, '2023 - 2026', 'active', false, 68.9, '2023-08-06')
ON CONFLICT (student_id_text) DO NOTHING;

-- Electrical Engineering students
INSERT INTO public.students (student_id_text, name, email, course, branch, department, semester, session, status, face_enrolled, attendance_rate, registration_date) VALUES
  ('2024EE001', 'Gaurav Singh',              'gaurav.singh@abvgiet.ac.in',       'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 3, '2024 - 2027', 'active', false, 80.0, '2024-08-05'),
  ('2024EE002', 'Pooja Tripathi',            'pooja.tripathi@abvgiet.ac.in',     'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 3, '2024 - 2027', 'active', false, 88.4, '2024-08-05'),
  ('2024EE003', 'Rahul Srivastava',          'rahul.srivastava@abvgiet.ac.in',   'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 3, '2024 - 2027', 'active', false, 74.2, '2024-08-06'),
  ('2024EE004', 'Kavya Agarwal',             'kavya.agarwal@abvgiet.ac.in',      'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 3, '2024 - 2027', 'active', false, 92.7, '2024-08-06'),
  ('2023EE001', 'Shivam Yadav',              'shivam.yadav@abvgiet.ac.in',       'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 5, '2023 - 2026', 'active', false, 77.6, '2023-08-04'),
  ('2023EE002', 'Preeti Saxena',             'preeti.saxena@abvgiet.ac.in',      'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 5, '2023 - 2026', 'active', false, 86.3, '2023-08-04')
ON CONFLICT (student_id_text) DO NOTHING;

-- Mechanical Engineering students
INSERT INTO public.students (student_id_text, name, email, course, branch, department, semester, session, status, face_enrolled, attendance_rate, registration_date) VALUES
  ('2024ME001', 'Akash Pandey',              'akash.pandey@abvgiet.ac.in',       'Mechanical Engineering', 'Mechanical Engineering', 'Mechanical Engineering', 3, '2024 - 2027', 'active', false, 73.5, '2024-08-05'),
  ('2024ME002', 'Simran Kaur',               'simran.kaur@abvgiet.ac.in',        'Mechanical Engineering', 'Mechanical Engineering', 'Mechanical Engineering', 3, '2024 - 2027', 'active', false, 85.1, '2024-08-05'),
  ('2024ME003', 'Yash Sharma',               'yash.sharma.me@abvgiet.ac.in',     'Mechanical Engineering', 'Mechanical Engineering', 'Mechanical Engineering', 3, '2024 - 2027', 'active', false, 80.8, '2024-08-06'),
  ('2023ME001', 'Manish Kumar Mishra',       'manish.mishra@abvgiet.ac.in',      'Mechanical Engineering', 'Mechanical Engineering', 'Mechanical Engineering', 5, '2023 - 2026', 'active', false, 69.4, '2023-08-04'),
  ('2023ME002', 'Swati Shukla',              'swati.shukla@abvgiet.ac.in',       'Mechanical Engineering', 'Mechanical Engineering', 'Mechanical Engineering', 5, '2023 - 2026', 'active', false, 91.2, '2023-08-04')
ON CONFLICT (student_id_text) DO NOTHING;

-- Electronics & Communication Engineering students
INSERT INTO public.students (student_id_text, name, email, course, branch, department, semester, session, status, face_enrolled, attendance_rate, registration_date) VALUES
  ('2024ECE001', 'Ritika Bajpai',            'ritika.bajpai@abvgiet.ac.in',      'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 3, '2024 - 2027', 'active', false, 87.3, '2024-08-05'),
  ('2024ECE002', 'Aman Rastogi',             'aman.rastogi@abvgiet.ac.in',       'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 3, '2024 - 2027', 'active', false, 81.9, '2024-08-05'),
  ('2024ECE003', 'Muskan Sehgal',            'muskan.sehgal@abvgiet.ac.in',      'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 3, '2024 - 2027', 'active', false, 94.0, '2024-08-06'),
  ('2023ECE001', 'Nikhil Agrawal',           'nikhil.agrawal@abvgiet.ac.in',     'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 5, '2023 - 2026', 'active', false, 78.8, '2023-08-04'),
  ('2023ECE002', 'Deepika Bajpai',           'deepika.bajpai@abvgiet.ac.in',     'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 'Electronics & Communication Engineering', 5, '2023 - 2026', 'active', false, 88.5, '2023-08-04')
ON CONFLICT (student_id_text) DO NOTHING;

-- ── Pending / Inactive students (to populate the Approvals panel) ─────────────
INSERT INTO public.students (student_id_text, name, email, course, branch, department, semester, session, status, face_enrolled, attendance_rate, registration_date) VALUES
  ('2025CE001', 'Isha Kapoor',               'isha.kapoor@abvgiet.ac.in',        'Computer Engineering', 'Computer Engineering', 'Computer Engineering', 1, '2025 - 2028', 'inactive', false, 0, '2025-08-01'),
  ('2025EE001', 'Rahul Pandey',              'rahul.pandey25@abvgiet.ac.in',     'Electrical Engineering', 'Electrical Engineering', 'Electrical Engineering', 1, '2025 - 2028', 'inactive', false, 0, '2025-08-01')
ON CONFLICT (student_id_text) DO NOTHING;

-- ── Update student_count on courses to reflect approximate class sizes ──────
UPDATE public.courses SET student_count = 58 WHERE source_key = 'manual:CE-I-MP';
UPDATE public.courses SET student_count = 58 WHERE source_key = 'manual:CE-I-PH';
UPDATE public.courses SET student_count = 58 WHERE source_key = 'manual:CE-I-BCSL';
UPDATE public.courses SET student_count = 55 WHERE source_key IN ('manual:CE-II-DS', 'manual:CE-II-OOP');
UPDATE public.courses SET student_count = 52 WHERE source_key IN ('manual:CE-III-DBMS', 'manual:CE-III-OS');
UPDATE public.courses SET student_count = 50 WHERE source_key IN ('manual:CE-IV-CN', 'manual:CE-IV-SE');
UPDATE public.courses SET student_count = 48 WHERE source_key IN ('manual:CE-V-AI', 'manual:CE-V-WD');
UPDATE public.courses SET student_count = 45 WHERE source_key IN ('manual:CE-VI-ML', 'manual:CE-VI-PROJ');

-- ── Sample attendance records for today ────────────────────────────────────────
-- NOTE: branch/session columns on students depend on 20260520_update_domain_model.sql running first.
-- This inserts attendance for Semester-III students in their respective branch course.
INSERT INTO public.attendance (student_id, course_id, timetable_course_code, timetable_course_name, department, semester, date_attended, status)
SELECT
  s.id,
  c.id,
  c.course_code,
  c.course_name,
  c.department,
  c.semester,
  CURRENT_DATE,
  CASE WHEN random() > 0.2 THEN 'present' ELSE 'absent' END
FROM public.students s
JOIN public.courses c
  ON (s.department = c.department OR s.course = c.department)
WHERE c.source_key IN ('manual:CE-III-DBMS', 'manual:EE-III-PE', 'manual:ME-III-HT', 'manual:ECE-III-SS')
  AND s.semester = 3
  AND s.status = 'active'
ON CONFLICT DO NOTHING;
