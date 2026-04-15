# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
npm install

# Start development server (port 5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

No linting or test commands are configured.

## Environment Setup

Requires a `.env` file with:
```
VITE_SUPABASE_URL=<supabase project url>
VITE_SUPABASE_ANON_KEY=<supabase anon key>
```

## Tech Stack

- **React 18** + **TypeScript** with Vite
- **React Router v6** for client-side routing (SPA, deployed on Vercel)
- **Supabase** for database (PostgreSQL) and authentication
- **Tailwind CSS v4** for styling
- No state management library — pure React hooks throughout

## Architecture

**Entry point chain:** `index.html` → `src/main.tsx` → `src/app.tsx` (BrowserRouter + routes) → page components

**Routes** (defined in `app.tsx`):
- `/` — redirect logic based on auth + profile status
- `/signup` — Google OAuth and email magic link sign-in
- `/callback` — Supabase OAuth callback handler
- `/register` — multi-step profile registration form
- `/directory` — alumni directory with client-side search/filter
- `/profile` — view/edit user profile
- `/admin` — admin dashboard (role-gated)

**Authentication flow:**
1. `signup.tsx` initiates Google OAuth or email magic link via Supabase Auth
2. `callback.tsx` handles the OAuth redirect, calls an RPC to ensure the user row exists in `public.users`, then redirects to `/register` or `/directory`
3. Auth helpers and TypeScript interfaces (`UserProfile`, `UserRole`, `ProfileFormData`) live in `src/lib/auth.ts`
4. Supabase client singleton is in `src/lib/supabaseClient.ts`

**Database tables:**
- `users` — id, email, role (`alumni` | `admin`)
- `profiles` — id, user_id (FK), name, graduation_year, current_company, job_title, current_city, bio, email, linkedin_url, sector, member_status (`alum` | `student` | `admin`), profile_picture_url, created_at, updated_at

**Data access:** All DB calls use the Supabase JS client directly inside page components via `useEffect` — no abstraction layer or caching.

**Reusable component:** `src/components/ProfileCard.tsx` — used in the directory to display alumni preview cards.

**Admin features** (`admin.tsx`): stats dashboard, profile deletion, CSV export; access is checked against `users.role === 'admin'`. Admins are designated manually in Supabase — there is no in-app promotion flow. Hidden contact info is visible to admins only.

## Product Notes

- The directory is **login-gated** — both current students and alumni are users
- No registration approval flow; admins remove bad actors manually
- Columbia/Barnard email validation is enforced server-side (Supabase), not just client-side
- **Mobile responsiveness** is a requirement but not yet implemented — consider layout on both viewports when making UI changes
- Philosophy: **minimal but do it well** — keep scope tight, prioritize polish over new features
