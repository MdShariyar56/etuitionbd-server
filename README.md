# eTuitionBD Server

REST API for **eTuitionBD**, a tuition management platform where students post tuitions, tutors apply, and admins moderate everything.

**Client repository:** https://github.com/MdShariyar56/etuitionbd-client (live: https://etuitionbd-client-eight.vercel.app)
**Live API URL:** https://etuitionbd-server-seven.vercel.app

## Purpose

Provide a secure backend for authentication, tuition posting, tutor applications, Stripe payments and admin analytics.

## Features

- Firebase ID token verification, then our own JWT (role and expiry verified on every request).
- Role based access control for student, tutor and admin routes.
- Tuitions: create, edit, delete, public listing with search, sort, filters and pagination.
- Applications: tutors apply, edit or delete until approved; students approve (after payment) or reject.
- Payments: Stripe PaymentIntent, verified server side before a tutor is approved.
- Admin: user management, tuition moderation, stats and transaction history.
- CORS handled in `proxy.js` for the configured client origin(s).

## Packages used

Next.js (route handlers), MongoDB driver, firebase-admin, jose (JWT), Stripe.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in your keys
npm run dev                  # http://localhost:4000
```

Secrets live only in `.env.local` and are never committed.

## Deployment checklist

- Add every variable from `.env.example` to the hosting provider.
- Set `CLIENT_URL` to the deployed client URL (comma separate multiple origins).
- Allow `0.0.0.0/0` in MongoDB Atlas network access.

## Demo data

`npm run seed` inserts demo tutors, students and tuitions. `node scripts/seed-demo.cjs --remove` deletes them.
