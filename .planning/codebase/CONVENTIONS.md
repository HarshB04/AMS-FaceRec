# Conventions

## TypeScript
- Strict type checking is enforced via `tsconfig.json`.
- Prefer interfaces over types for object shapes when possible.

## Import Paths
- Path alias `@/` points to `./src/` (configured in `tsconfig.json` and `vite.config.ts`), primarily to support Shadcn UI imports.

## Environment Variables
- Uses Vite's `import.meta.env` for environment variable access (e.g., `import.meta.env.VITE_SUPABASE_URL`).
- Legacy Next.js `process.env` references should be avoided or refactored.

## UI/Styling
- Tailwind CSS utility classes are the primary styling mechanism.
- Shadcn UI components are used for common interface elements.
- Components should default to "light" theme unless a proper `ThemeProvider` is implemented.
