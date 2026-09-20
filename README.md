# ClassPortal

A production-shaped learning platform: authentication, courses, video lessons
with persisted progress, automatic certificate issuance, public certificate
verification, PDF/print export, a student dashboard, and a full admin panel.

> Retheme note: the site name lives in one place — `lib/site-config.ts`.
> Change `SITE_NAME_PRIMARY` / `SITE_NAME_ACCENT` there to rename the whole
> site. Lessons also now support an optional quiz: paste a link or upload an
> HTML file in the admin lesson form (`quizUrl` field, `prisma/schema.prisma`).
> **Run `npx prisma migrate dev --name add_quiz_url` after pulling this** to
> add the new column to your database.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · PostgreSQL ·
Prisma · JWT (HTTP-only cookie) · React Three Fiber · html2canvas + jsPDF ·
qrcode.react · Recharts.

## 1. Setup

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL and JWT_SECRET at minimum
npx prisma migrate dev --name init
npm run dev
```

Open http://localhost:3000.

### Creating your first admin account

Every signup is created as `STUDENT` (by design — see `app/api/auth/signup/route.ts`).
Two ways to get an admin account:

**Easier — run the seed script:**

```bash
npm run db:seed
```

This creates (or promotes) an admin account using `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD` / `SEED_ADMIN_NAME` from `.env` (sensible defaults are
in `.env.example` — change the password before using this anywhere real).

**Or manually**, promote an account you already signed up with:

```bash
npx prisma studio
# open the User table, find your row, set role = ADMIN
```

or via SQL:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Once you have one admin, you can promote/demote other users from
`/admin/users` in the app itself.

## 2. Environment variables

See `.env.example` for the full list. Only `DATABASE_URL` and `JWT_SECRET`
are required to run the app. Everything else degrades honestly instead of
faking success when unset:

- **No `EMAIL_PROVIDER_API_KEY`** — password reset links are logged to the
  server console instead of emailed (`services/mailer.ts`). The forgot-password
  UI surfaces this (`devNote`) rather than pretending an email was sent.
- **No `PAYMENT_PROVIDER_SECRET_KEY`** — checkout creates a real `PENDING`
  Payment row but has no live gateway to redirect to. In development
  (`NODE_ENV !== 'production'` and `ALLOW_MOCK_PAYMENTS=true`), the checkout
  page offers a "Simulate Successful Payment" button that exercises the exact
  same enrollment path a real webhook would (`services/payment.ts`,
  `app/api/payment/mock-confirm/route.ts`). **Never set `ALLOW_MOCK_PAYMENTS`
  in production** — the endpoint hard-refuses if `NODE_ENV === 'production'`.

## 3. Wiring a real payment provider

All payment-provider logic is isolated in `services/payment.ts` and
`app/api/payment/webhook/route.ts`. To go live:

1. Pick a provider (Paystack/Flutterwave/Stripe) and set
   `PAYMENT_PROVIDER_SECRET_KEY` + `PAYMENT_WEBHOOK_SECRET`.
2. Fill in `createCheckoutSession()` in `services/payment.ts` (a commented
   example call is already there).
3. Fill in `verifyWebhookSignature()` with the provider's real signature
   check.
4. Point the provider's webhook at `POST /api/payment/webhook`.

Nothing else in the codebase needs to change — checkout, `/payment/success`,
and enrollment all already key off `Payment.status` and the webhook, not off
the client redirect.

## 4. Wiring a real email provider

Same pattern, isolated in `services/mailer.ts`. Uncomment/adapt the example
`fetch` call, set `EMAIL_PROVIDER_API_KEY`, done.

## 5. Uploading video/thumbnail files directly

By default, course thumbnails and lesson videos are just URL fields — you
paste a link to an already-hosted file. If you'd rather upload files
straight from the admin panel (drag-and-drop from your computer), set up
S3-compatible storage:

1. Get an S3-compatible bucket — AWS S3, Cloudflare R2, Backblaze B2,
   Bunny.net, or DigitalOcean Spaces all work.
2. Set `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
   in `.env` (see `.env.example`). For non-AWS providers, also set
   `S3_ENDPOINT`. If files are served through a CDN or custom domain, set
   `S3_PUBLIC_URL_BASE`.
3. Make sure the bucket allows public read on uploaded objects (or put a CDN
   in front of it) — the app stores the resulting public URL directly on the
   course/lesson.

Once set, an **"Upload video file instead"** / **"Upload thumbnail image
instead"** button appears next to each URL field in the admin course editor.
Files upload directly from the browser to your bucket via a short-lived
presigned URL (`POST /api/admin/uploads/presign`, admin-only) — they never
pass through the Next.js server, which matters for large video files.

**Without storage configured**, those buttons show a clear "not configured"
message instead of silently failing, and the manual URL field still works
exactly as before — nothing is blocked.

## 6. Certificate assets

`components/certificate/CertificateTemplate.tsx` currently renders the
certificate frame, seal, and signature as CSS/SVG so it works with zero
assets. If you want to swap in real artwork, drop files into
`public/certificate/` (background.png, logo.png, signature.png, seal.png,
corner-*.png, etc.) and reference them there — the layout is already sized
for an A4-landscape ratio so images will slot in without reflowing anything.

## 7. Project structure

```
app/
├── (auth)/            # login, signup, forgot-password
├── dashboard/          # student area (profile, certificates, settings)
├── courses/[slug]/     # course detail + video player
├── checkout/, payment/success/
├── certificates/[id]/  # certificate view/download/print
├── verify/[certificateNo]/  # public verification (no auth)
├── admin/              # users, courses (+ lesson manager), payments, analytics
└── api/                # every route above backed by a real handler
components/
lib/                     # auth.ts, prisma.ts, certificate.ts, validation.ts, api-response.ts
services/                # payment.ts, mailer.ts (provider-agnostic)
prisma/schema.prisma
```

## 8. Notes on things that matter

- **Lesson progress**: `GET/POST /api/lessons/[lessonId]/progress` — the
  dynamic segment is named `[lessonId]` end-to-end (route folder, `Params`
  type, destructuring). This was called out explicitly as a past regression
  point; it's covered.
- **Certificate routes are plural** throughout: `/certificates/[id]`,
  `/api/certificates/[id]`, `/dashboard/certificates`.
- **Certificate issuance is idempotent**: `issueCertificateIfNeeded()` checks
  the `[userId, courseId]` unique constraint first and catches `P2002` as a
  race-condition fallback, so simultaneous "complete last lesson" requests
  can't create duplicate certificates.
- **Certificate numbers** come from a single-row atomic counter
  (`CertificateCounter`, incremented inside a transaction) rather than
  `COUNT(*)`, which isn't safe under concurrent completions.
- **Authorization is always server-derived.** Every route resolves identity
  from the JWT cookie via `requireUser`/`requireAdmin` — no endpoint trusts a
  client-supplied `userId` or `role`.

## 9. A note on how this was verified

This app was built and checked inside a sandboxed environment without
internet access to `binaries.prisma.sh` (so the Prisma engine itself
couldn't be downloaded/run there) or `fonts.googleapis.com`. Within that
constraint, it was still verified as thoroughly as possible:

- A full `tsc --noEmit` typecheck passes across the entire codebase.
- A full `next build` (all 39 routes, all API handlers) completes
  successfully — this caught and fixed 4 real bugs (missing `Suspense`
  boundaries around `useSearchParams` on the login, forgot-password,
  checkout, and payment-success pages).

What was **not** possible to verify inside that sandbox: an actual
`prisma migrate dev` against a live Postgres instance, or exercising the app
end-to-end in a browser. Run through the checklist in the original spec
(§60) once you have it running locally — the signup → enroll → watch →
complete → certificate → verify path is the one most worth clicking through
first.
