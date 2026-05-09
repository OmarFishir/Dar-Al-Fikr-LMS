# SchoolHub — Railway build

A Railway-deployable fork of the SchoolHub LMS. Original was built for Manus
and used Manus OAuth + Forge S3 + Forge LLM. This version replaces all of
that with self-contained equivalents:

| Concern | Manus build | Railway build |
| --- | --- | --- |
| Auth | Manus OAuth portal | Email + name → JWT cookie (`/api/auth/login`) |
| Database | Manus MySQL | Railway MySQL (`DATABASE_URL`) |
| File storage | Forge presigned S3 | Local disk under `STORAGE_DIR` |
| LLM | Forge endpoint | Any OpenAI-compatible API (`OPENAI_API_KEY`) |

The login is intentionally simple: anyone with the email gets in. Treat this
as a testing/demo deployment, not production-grade auth.

## Deploy on Railway

### 1. Create the services

In your Railway project:

1. **Add a MySQL database** — Railway → New → Database → MySQL.
2. **Add this app** — New → GitHub repo (push this folder first), or
   `railway up` from this directory with the Railway CLI.

### 2. Set environment variables

On the app service, set:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | `${{ MySQL.MYSQL_URL }}` (reference the MySQL service) |
| `JWT_SECRET` | A random string. `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `NODE_ENV` | `production` |
| `OWNER_EMAIL` | Your email (gets `admin` role on first login) |
| `TEACHER_EMAILS` | Comma-separated emails that auto-receive `teacher` role |
| `OPENAI_API_KEY` | *(optional)* enables AI features |
| `OPENAI_API_BASE` | *(optional)* default `https://api.openai.com/v1` |
| `OPENAI_MODEL` | *(optional)* default `gpt-4o-mini` |
| `STORAGE_DIR` | *(optional)* default `./uploads`. See "Persistent files" below. |

`PORT` is set automatically by Railway — don't override it.

### 3. Deploy

Railway's Nixpacks builder picks up `package.json` automatically. The
`railway.json` in this repo points the start command at
`pnpm run start:railway`, which runs DB migrations before booting the server.

First boot takes ~1–2 min. When the deploy is green, open the public URL,
sign in with `OWNER_EMAIL` to get the admin role, and start adding classes.

### 4. (Optional) Persistent file uploads

By default, files written to `./uploads` are lost on every redeploy because
the container filesystem is ephemeral. To keep them:

1. Railway service → **Volumes** → New Volume.
2. Mount path: `/data`.
3. Set env var `STORAGE_DIR=/data/uploads`.
4. Redeploy.

## Local dev

You need a MySQL instance reachable from your machine.

```bash
pnpm install
cp .env.example .env  # fill in DATABASE_URL + JWT_SECRET at minimum
pnpm run db:push       # generate + apply migrations
pnpm run dev           # http://localhost:3000
```

Sign in with any email at `/login`. Use the email in `OWNER_EMAIL` to get
admin, or one in `TEACHER_EMAILS` to get teacher.

## What's different from the original

If you diff against the Manus version, the changes are confined to:

- `server/_core/oauth.ts` — POST `/api/auth/login` instead of OAuth callback.
- `server/_core/sdk.ts` — JWT-only, no Manus API calls.
- `server/_core/env.ts` — new env shape (see `.env.example`).
- `server/_core/cookies.ts` — `sameSite=lax` for HTTP, `none` for HTTPS.
- `server/_core/index.ts` — `trust proxy`, `assertEnv()` at boot.
- `server/storage.ts` + `server/_core/storageProxy.ts` — local-disk storage.
- `server/_core/llm.ts` — OpenAI-compatible endpoint, `gpt-4o-mini` default.
- `client/src/const.ts` — `getLoginUrl()` returns `/login`.
- `client/src/pages/Login.tsx` — new email + name form.
- `client/src/App.tsx` — registers the `/login` route.
- `package.json` — `cross-env`, `start:railway`, `drizzle-kit` moved to deps.
- `railway.json` — start command + healthcheck.

The Manus-only features (image generation, voice transcription, push
notifications, Google Maps proxy) are left wired up but will throw a "not
configured" error when invoked, since they relied on the Manus Forge service.
The core LMS — classes, assignments, quizzes, attendance, points, modules,
messaging, weekly plans, meetings — works without any of them.
