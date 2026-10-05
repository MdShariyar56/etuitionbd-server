# E-TuitionBD Server

REST API for **E-TuitionBD**, a tuition management platform where students post tuitions, tutors apply, and admins moderate everything.

| | |
|---|---|
| **Live API** | https://etuitionbd-server-seven.vercel.app |
| **Server repository** | https://github.com/MdShariyar56/etuitionbd-server |
| **Client repository** | https://github.com/MdShariyar56/etuitionbd-client |
| **Live site** | https://etuitionbd-client-eight.vercel.app |

## Purpose

Provide a secure backend for authentication, tuition posting, tutor applications, Stripe payments and admin analytics.

## Features

- **Firebase ID tokens** are verified against Google's public keys (with `jose`, no service account needed), then exchanged for our own **JWT** (role and expiry checked on every request).
- **Role based access control** for student, tutor and admin routes. The user is re-loaded from the database on each request, so a blocked or demoted account loses access immediately.
- **Tuitions:** create, edit, delete, public listing with search, sort, filters and pagination, plus admin moderation.
- **Applications:** tutors apply, edit or delete until approved. Students accept (after payment) or reject.
- **Payments:** Stripe PaymentIntent, verified server side before a tutor is approved, with a transaction history.
- **Admin:** user management, tuition approval, platform statistics and revenue analytics.
- **CORS** handled in `proxy.js` for the configured client origin(s) only.

## API overview

All routes live under `/api`. Protected routes expect `Authorization: Bearer <jwt>`.

| Method | Endpoint | Access |
|---|---|---|
| POST | `/auth/session` | Public (exchanges a Firebase ID token for a JWT) |
| GET | `/auth/me` | Any signed-in user |
| GET | `/tuitions` | Public (search, sort, filters, pagination) |
| GET | `/tuitions/filters` | Public |
| GET | `/tuitions/[id]` | Public when approved, otherwise owner or admin |
| POST | `/tuitions` | Student |
| GET | `/tuitions/mine` | Student |
| PATCH, DELETE | `/tuitions/[id]` | Owner student (admin can delete) |
| GET | `/tuitions/admin` | Admin |
| PATCH | `/tuitions/[id]/status` | Admin (approve or reject) |
| GET | `/tutors`, `/tutors/[id]` | Public |
| GET | `/applications` | Tutor (own) or student (received) |
| POST | `/applications` | Tutor (apply) |
| GET | `/applications/[id]` | Tutor or student involved |
| PATCH, DELETE | `/applications/[id]` | Tutor (own, until approved) |
| PATCH | `/applications/[id]/reject` | Student |
| POST | `/payments/intent`, `/payments/confirm` | Student |
| GET | `/payments` | Signed-in user (own history, all for admin) |
| GET | `/stats` | Admin |
| GET | `/users` | Admin |
| PATCH, DELETE | `/users/[id]` | Admin |
| PATCH | `/users/me` | Signed-in user |

## Tech stack and packages

Next.js (route handlers), MongoDB driver, jose (JWT and Firebase ID token verification), Stripe.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:4000
```

### Environment variables

| Variable | Purpose |
|---|---|
| `MONGODB_URI`, `MONGODB_DB` | MongoDB Atlas connection and database name |
| `JWT_SECRET` | Long random string used to sign JWTs |
| `ADMIN_EMAIL` | The account registered with this email becomes the admin |
| `CLIENT_URL` | Allowed client origin(s) for CORS, comma separated |
| `FIREBASE_PROJECT_ID` | Used to validate Firebase ID tokens |
| `STRIPE_SECRET_KEY`, `STRIPE_CURRENCY` | Stripe secret key and currency (for example `usd`) |

Secrets live only in `.env.local` and are never committed.

## Deployment checklist

- Add every variable from `.env.example` to the hosting provider.
- Set `CLIENT_URL` to the deployed client URL (comma separate multiple origins).
- Allow `0.0.0.0/0` in MongoDB Atlas network access.

## Demo data

`npm run seed` inserts demo tutors, students and tuitions. `node scripts/seed-demo.cjs --remove` deletes them.
