# Requirements: AMS-FaceRec

**Defined:** 2026-04-29
**Core Value:** Make attendance faster, more reliable, and harder to falsify using face recognition.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Security & Authentication

- [ ] **AUTH-01**: User can log in securely via Supabase Auth
- [ ] **AUTH-02**: System automatically routes user to role-specific dashboard (`admin`, `teacher`, `student`)
- [ ] **AUTH-03**: Row Level Security (RLS) restricts data access to authorized roles only
- [ ] **AUTH-04**: JWT role spoofing is prevented at the database level

### Admin Portal

- [ ] **ADMIN-01**: Admin can view, create, edit, and delete Student records
- [ ] **ADMIN-02**: Admin can view, create, edit, and delete Course records
- [ ] **ADMIN-03**: Admin can view, create, edit, and delete Instructor records
- [ ] **ADMIN-04**: Admin can enroll students into specific courses
- [ ] **ADMIN-05**: Admin can perform in-person face enrollment using the local Python engine

### Teacher Portal

- [ ] **TCHR-01**: Teacher can view their assigned courses
- [ ] **TCHR-02**: Teacher can launch live camera attendance view for a specific course
- [ ] **TCHR-03**: Teacher can view real-time attendance updates as students are scanned
- [ ] **TCHR-04**: Teacher can export attendance reports as CSV
- [ ] **TCHR-05**: Teacher can export attendance reports as PDF

### Student Portal

- [ ] **STU-01**: Student can view their overall attendance history
- [ ] **STU-02**: Student can view their enrolled courses and schedules
- [ ] **STU-03**: Student can view their face enrollment status
- [ ] **STU-04**: Student can view their weekly attendance analysis

### Automated Notifications

- [ ] **NOTF-01**: System sends an automated email to a student when they are marked absent
- [ ] **NOTF-02**: System alerts admins when a student's attendance drops below 75%
- [ ] **NOTF-03**: System sends a weekly attendance digest to teachers

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Integrations

- **INT-01**: Integration with centralized campus Student Information Systems (SIS)
- **INT-02**: Single Sign-On (SSO) with Microsoft Entra or Google Workspace

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Remote/self-serve face enrollment | Prevents falsification; requires admin verification. |
| Offline queue sync | MVP requires always-online connection for immediate data accuracy. |
| Custom password reset forms | Rely purely on Supabase magic links to minimize auth surface area. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| [Unmapped] | TBD | Pending |

**Coverage:**
- v1 requirements: 21 total
- Mapped to phases: 0
- Unmapped: 21 ⚠️

---
*Requirements defined: 2026-04-29*
*Last updated: 2026-04-29 after initial definition*
