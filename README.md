# AutoApply — LinkedIn EasyApply tracker

![CI](https://github.com/metz97/lab-autoapply/actions/workflows/ci.yml/badge.svg)

A Supabase-auth dashboard and REST API that let a Chrome extension pre-fill LinkedIn EasyApply forms in your own browser session — you click submit, and every attempt streams back here for tracking.

> Backend + dashboard only. The Chrome extension that fills forms lives in a separate repo and is **not** included here; this project is the API and dashboard it talks to.

## Tech stack

`Next.js (App Router)` · `TypeScript` · `Tailwind CSS v4` · `Supabase Auth + Postgres (RLS)` · `Zod` · `Upstash rate-limit` · `REST API`

![AutoApply screenshot](docs/lab-autoapply.png)

## Features

- **Email magic-link + Google OAuth sign-in** via Supabase Auth.
- **Application dashboard** — search, status filter, and pagination over every recorded attempt (queued / applied / failed / needs_review / skipped).
- **Application profile** — name, contact, LinkedIn URL, resume URL, and reusable default screening answers used by the extension.
- **Hashed API tokens** — issue and revoke bearer tokens for the extension; the raw token is shown only once and only its SHA-256 hash is stored.
- **Extension REST API** with permissive CORS and a bearer-token contract (see below).
- **Row-Level Security** — every table is scoped to the owning `auth.users` row.
- **Optional distributed rate limiting** via Upstash Redis (no-ops when unset).

## Architecture

Three moving parts:

1. **Dashboard (this repo)** — Next.js App Router pages (`/`, `/login`, `/dashboard`, `/settings`). Authenticated pages are gated by `src/middleware.ts`, which redirects unauthenticated users to `/login`. Dashboard/settings data is fetched from the same-origin session-authenticated API routes using the browser session cookie.
2. **REST API (this repo)** — Route handlers under `src/app/api/*`. Two auth modes:
   - **Session auth** (cookie) for dashboard-facing endpoints (`/api/profile`, `/api/tokens`, `GET /api/applications`).
   - **Bearer-token auth** for extension-facing endpoints (`POST /api/applications`, `PATCH /api/applications/:id`, `GET /api/extension/profile`).
3. **Chrome extension (separate repo)** — Runs in the user's own logged-in LinkedIn tab, reads the saved profile via the API, fills EasyApply fields, and reports each attempt back. No server-side scraping and no LinkedIn credentials are ever handled by this backend.

## Extension REST API contract

Extension-facing endpoints authenticate with a **bearer token** issued from **Settings → API tokens** (`POST /api/tokens`). Tokens look like `aa_live_…`; only their SHA-256 hash is stored server-side. Send the token as:

```
Authorization: Bearer aa_live_xxxxxxxxxxxxxxxxxxxx
```

All extension endpoints send permissive CORS headers (`Access-Control-Allow-Origin: *`) and answer `OPTIONS` preflight with `204`. Responses are JSON with an `ok` boolean; errors are `{ ok: false, error, code }`.

| Method & path | Auth | Purpose | Notes |
| --- | --- | --- | --- |
| `GET /api/applications` | Session (cookie) | List the signed-in user's applications | Query: `page`, `pageSize` (max 50), `status`, `q` (company/title search). Returns `{ applications, page, pageSize, total, hasMore }`. |
| `POST /api/applications` | Bearer | Record a new application attempt | Body validated by `ApplicationCreateSchema` (`jobTitle`, `company`, `status`, optional `location`, `jobUrl`, `externalJobId`, `appliedAt`, `screeningAnswers`). Returns `{ application, isFirstApplication }`. |
| `PATCH /api/applications/:id` | Bearer | Update an attempt's status/details | Body validated by `ApplicationPatchSchema` (`status`, `errorMessage`, `appliedAt`, `screeningAnswers`). Scoped to the token owner; `404` if not found. |
| `GET /api/extension/profile` | Bearer | Fetch the saved profile for form-filling | Returns `{ profile }`; `404` (`profile_missing`) if the profile has not been completed. |
| `GET /api/profile` | Session (cookie) | Read the signed-in user's profile | Returns `{ profile }`. |
| `PUT /api/profile` | Session (cookie) | Upsert the profile | Body validated by `ProfileUpdateSchema`. |
| `GET /api/tokens` | Session (cookie) | List issued tokens (no secrets) | Returns metadata + `active` flag only. |
| `POST /api/tokens` | Session (cookie) | Issue a new token | Returns the raw token **once** — store it immediately. |
| `DELETE /api/tokens?id=…` | Session (cookie) | Revoke a token | Sets `revoked_at`; revoked tokens fail bearer verification. |

Bearer-authenticated requests are rate-limited per user when Upstash Redis is configured; otherwise they are always allowed.

## Getting started

```bash
git clone <this-repo>
cd lab-autoapply
npm install
cp .env.example .env
```

1. Create a [Supabase](https://supabase.com) project.
2. In the Supabase SQL editor (or via the CLI), run the migration in `supabase/migrations/004_autoapply_lab.sql`. It creates the `autoapply_profiles`, `autoapply_tokens`, and `autoapply_applications` tables with Row-Level Security policies.
3. Fill in `.env` with your Supabase URL, anon key, and service-role key (Upstash is optional).
4. Start the dev server:

```bash
npm run dev
```

Open http://localhost:3000, sign in, complete your profile, and issue an API token for the extension.

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run test` | Vitest (unit tests) |

## Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase public anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service-role key (server-only) |
| `UPSTASH_REDIS_REST_URL` | No | Upstash Redis REST URL (enables rate limiting) |
| `UPSTASH_REDIS_REST_TOKEN` | No | Upstash Redis REST token |
| `NEXT_PUBLIC_PORTFOLIO_URL` | No | Target of the "Back to portfolio" link |
| `AUTOAPPLY_EXTENSION_RATE_LIMIT_MAX` | No | Max extension requests per window per user (default 120) |
| `AUTOAPPLY_EXTENSION_RATE_LIMIT_WINDOW_MS` | No | Rate-limit window in ms (default 3,600,000) |

The app builds and runs with no secrets set — Supabase and Upstash clients are created lazily and the API returns a `503 not_configured` until you provide real values.

## Part of my portfolio

This is a standalone extract of one lab from my portfolio. See more at https://khalidahmad.dev

## License

MIT — see [LICENSE](./LICENSE).
