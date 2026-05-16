---
phase: "09"
phase_name: "student-registration-backend"
status: "passed"
verified: "2026-05-16"
must_haves_verified: 5
must_haves_total: 5
---

# Verification: Phase 9 — Student Self-Registration Backend

## Phase Goal

Build a secure Express.js backend that isolates the service role key, implements the complete student self-registration workflow with SBRN-based login, admin approval/rejection pipeline, and email notifications.

## Must-Have Verification

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 1 | Service role key never reaches the browser | `backend/config/supabaseClient.js` reads `SUPABASE_SERVICE_ROLE_KEY` server-side only; no `VITE_` prefix | ✅ |
| 2 | Students can self-register with SBRN | `POST /api/auth/register` in `registrationController.js` — creates auth user + profiles (pending) + students (inactive) | ✅ |
| 3 | Admin can approve/reject registrations | `POST /api/admin/approve/:id` and `reject/:id` with role guard; updates both tables atomically | ✅ |
| 4 | Approved students receive email with SBRN | `sendApprovalEmail()` in `emailService.js` fires after approval; SBRN displayed prominently in HTML email | ✅ |
| 5 | Frontend approval dashboard with live badge | `AdminApprovals.tsx` + sidebar pending-count badge via `backendGetPendingUsers()` | ✅ |

## Human Verification Items

1. **Self-registration flow**: Navigate to `/register`, fill form with valid SBRN/email/password → should show "pending approval" confirmation
2. **Admin approvals**: Login as admin → `/admin/approvals` → badge should show pending count → Approve button should update status and trigger email
3. **SBRN login after approval**: After approving, student should be able to log in using their SBRN + password via the Student Login flow
4. **Duplicate guard**: Re-registering with same email or SBRN should return a clear error message
5. **SMTP graceful degradation**: Remove SMTP env vars → approval still succeeds, backend logs warning but does not 500

## Gaps

(none — all must-haves verified against codebase)
