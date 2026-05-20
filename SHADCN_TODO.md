# Shadcn UI — Future Migration Guide

## What is Shadcn UI?

**Shadcn UI** is not a traditional UI component library.
Instead, it is a **collection of beautifully designed, accessible components** that you *copy directly into your project* — you own the code.

Think of it like this:
- Normal library (e.g. Material UI): you `import Button from 'mui'` — the code lives in `node_modules`, you cannot edit it easily.
- Shadcn UI: you run `npx shadcn-ui add button` — it **copies** `src/components/ui/button.tsx` into your project. You can style it however you like.

It is built on top of:
- **Radix UI** — for accessible, headless behavior (dialogs, dropdowns, tooltips, etc.)
- **Tailwind CSS** — for all the visual styling
- **class-variance-authority (CVA)** — for managing component variants (e.g. `variant="destructive"`)

This makes it perfect for AMS-FaceRec because we already use Tailwind, and we want full control over the design.

---

## Why Do We Want It?

The current codebase mixes raw Tailwind `className` strings scattered across many components.
This causes:
- Inconsistent styling (e.g. different button rounding in different pages)
- Hard-to-maintain code when design changes
- Missing accessibility features (keyboard navigation, focus rings, ARIA attributes)

With Shadcn UI:
- All buttons, inputs, dialogs, and tables look consistent everywhere
- Accessibility is built-in (Radix UI handles it)
- Changing the design system just means editing one file

---

## Current Status

> **NOT INSTALLED YET** — keeping things simple for now with raw Tailwind CSS.

Some components that already exist in `src/app/components/ui/` (like `button.tsx`, `dialog.tsx`, `table.tsx`) were added manually and are already Shadcn-style. `AdminTeachers.tsx` uses them.

The rest of the app (LiveCamera, RegistrationPage, StudentDashboard, etc.) uses raw Tailwind.

---

## TODO: Migration Steps

When you are ready to fully adopt Shadcn UI, follow these steps:

### Step 1 — Initialize Shadcn UI in the project

```bash
npx shadcn-ui@latest init
```

Answer the prompts:
- TypeScript: **Yes**
- Style: **Default**
- Base color: **Slate**
- CSS variables: **Yes**
- Tailwind config path: `tailwind.config.js`
- Components path: `src/app/components/ui`
- Utils path: `src/app/lib/utils`

### Step 2 — Add the core components you need

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add select
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add card
```

### Step 3 — Migrate pages one by one

Replace raw Tailwind patterns with Shadcn components:

| Current Raw Tailwind                          | Shadcn Replacement                        |
|-----------------------------------------------|-------------------------------------------|
| `<button className="px-4 py-2 bg-blue-600...">` | `<Button>` from `@/app/components/ui/button` |
| `<input className="border rounded...">` | `<Input>` from `@/app/components/ui/input` |
| `<select className="...">` | `<Select>` + `<SelectItem>` from shadcn |
| Custom modal divs | `<Dialog>` from shadcn |
| Custom stat cards | `<Card>` from shadcn |

### Step 4 — Update the theme

Edit `src/index.css` (or wherever CSS variables are declared) to customize the color palette to match the AMS branding (indigo/blue primary).

---

## Pages to Migrate (Priority Order)

1. `RegistrationPage.tsx` — lots of raw inputs and selects → replace with Shadcn `Input` + `Select`
2. `LoginPage.tsx` — same as above
3. `LiveCamera.tsx` — stats cards → `Card`, buttons → `Button`
4. `StudentDashboard.tsx` — summary cards → `Card`
5. `AdminApprovals.tsx` — table → `Table`, dialogs → `Dialog`
6. `StudentManagement.tsx` — already partially uses Shadcn; complete the migration

---

## Important Note on `getTimetableSlotsForProgram`

The `StudentSchedule.tsx` currently imports `getTimetableSlotsForProgram` from `lib/api.ts`. 
This function queries Supabase directly (bypasses the backend). When the backend API is fully complete, 
move this to a `backendApi.get('/api/timetable?...')` call instead.

---

*Last updated: May 2026*
