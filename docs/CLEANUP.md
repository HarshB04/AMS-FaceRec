# 🧹 Cleanup Log

> Documenting all files and directories removed during project cleanup.

---

## Removed on 2026-05-12

### Files Deleted

| File | Type | Reason |
|------|------|--------|
| `fix_urls.js` | One-off script | Used to replace old Edge Function URL strings (`make-server-803da240` → `server`). Fix was already applied to `src/app/lib/api.ts` and `supabase/functions/server/index.ts`. No longer needed. |
| `scratch/fix_login.cjs` | One-off script | Used to replace Tailwind color classes (`indigo` → `blue`) and strip inline font styles from `LoginPage.tsx`. Fix was already applied. No longer needed. |
| `roles.sql` | SQL file | Completely empty file (0 bytes). Had no content or purpose. |
| `utils/supabase/client.ts` | Duplicate module | A secondary Supabase client using `VITE_SUPABASE_PUBLISHABLE_KEY`. Not imported anywhere in `src/`. The canonical client lives at `src/lib/supabase.ts`. |
| `utils/supabase/info.tsx` | Auto-generated file | Exported `projectId` and `publicAnonKey` as hardcoded constants. Not used anywhere in `src/`. Hardcoding the anon key in source is also a security concern. |

### Directories Deleted

| Directory | Reason |
|-----------|--------|
| `scratch/` | Contained only `fix_login.cjs` (see above). Removed along with its contents. |
| `test/` | Completely empty directory with no files. |
| `utils/` | Contained only the unused `supabase/` subdirectory (see above). Removed along with its contents. |

---

## ⚠️ Do NOT Remove — Critical Files

The following files look like tooling/config but are **required** for the Edge Function to deploy and run correctly:

| File | Purpose |
|------|---------|
| `supabase/functions/server/deno.json` | Defines import maps for `hono`, `hono/cors`, `hono/logger`, and `@supabase/supabase-js`. Without this, Deno cannot resolve any imports in `index.ts`. Also sets `compilerOptions.lib` to `deno.window` for correct type checking. |
| `supabase/functions/server/deno.lock` | Locks the exact versions of all resolved Deno/npm/jsr dependencies. Ensures reproducible builds on Supabase's deployment servers. |
| `supabase/functions/deno.json` | Global compiler options for all Edge Functions (`strict: true`, `lib: deno.window`, `allowJs: true`). Inherited by all functions in the `functions/` directory. |

> **Rule:** Never delete files from `supabase/functions/` without verifying they are not Deno config or lock files.

---

## Canonical Locations (What to Use Instead)

| Purpose | Correct File |
|---------|-------------|
| Supabase client | `src/lib/supabase.ts` |
| Database schema | `supabase/schema.sql` |
| Edge Function entry | `supabase/functions/server/index.ts` |

---

## Git Commit

```
ae2dd45 — chore: remove unused one-off scripts and empty files
```
