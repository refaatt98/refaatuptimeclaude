# Standalone Pure Vite + npm Copy

## Goal
Create a downloadable copy of the current site that runs independently with `npm install`, `npm run dev`, and `npm run build`, ready for Netlify.

## Work
- Replace TanStack Start routing and server entry files with a standard Vite React entry.
- Preserve the current visual interface and reusable frontend components.
- Remove server-only, Lovable-only, and TanStack-only dependencies from the standalone copy.
- Convert data access that requires the current server into browser-safe Supabase access where feasible; clearly isolate unsupported privileged operations.
- Add Netlify SPA routing and build settings.
- Validate installation and production build, then provide the source as a ZIP download.

## Technical details
- React 19 + Vite + TypeScript + npm.
- `index.html` and `src/main.tsx` as the browser entry.
- No TanStack Start or TanStack Router runtime.
- Output directory: `dist`.
- Netlify build command: `npm run build`; publish directory: `dist`.
