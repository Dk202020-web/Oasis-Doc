# Oasis-Doc

A multi-service marketplace for document legalisation, obtention, and
certified translation — React + Vite + Tailwind frontend, Supabase
backend (Postgres + Auth + Storage + RLS).

This is a **functional v1 scaffold**: real auth, real catalog, real
cart/checkout, real admin panel, with basic/utility styling (as
requested) so you can polish the UI yourself. A handful of example
services are pre-seeded so you can test end-to-end immediately.

---

## 1. Create your Supabase project

1. Go to https://supabase.com, create a free account, then **New
   Project**. Pick any name/region/password (save the DB password
   somewhere safe).
2. Wait ~2 minutes for it to finish provisioning.
3. In the left sidebar, go to **Settings → API**. You'll need:
   - **Project URL**
   - **anon public** key

## 2. Run the database migration

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Open `supabase/migrations/0001_init.sql` from this project, copy its
   entire contents, paste into a new SQL Editor query, and click **Run**.
   This creates every table, the RLS policies, the auto-admin triggers,
   and the two private storage buckets.
3. (Optional but recommended for testing) Open `supabase/seed.sql`,
   copy its contents, paste into a new query, and **Run**. This creates
   example categories/sections/services (Légalisation, Obtention,
   Traduction) with a mix of text, date, image, PDF and multi-file
   requirement fields, so you have real data to click through.
4. To enable the diploma-equivalence workflow and its complete localized
   country list, run migrations `0002` through `0006` in filename order.

## 3. Create your admin account

The very first admin has to be granted manually (by design — see
"How roles work" below):

1. In the app (once running, see step 5) go to **Inscription** and
   create a normal account with your own email.
2. Back in Supabase, open **Table Editor → users**, find your row, and
   change `role` from `user` to `admin`. Save.
3. Refresh the app — you'll now see an **Admin** link in the navbar.

From then on, you can add further admins from **Admin → Co-admins**
in the dashboard — no more manual DB edits needed for that.

## 4. Configure the frontend

1. Make sure you have **Node.js 18+** installed.
2. In this project folder:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` and fill in the two values from step 1:
   ```
   VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
   ```

## 5. Run it locally

```bash
npm install
npm run dev
```

Open the URL it prints (usually http://localhost:5173).

## 6. Deploy (Cloudflare Pages, per the spec's recommended stack)

1. Push this project to a GitHub repo.
2. In Cloudflare Pages, create a new project from that repo.
3. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add the same two environment variables (`VITE_SUPABASE_URL`,
   `VITE_SUPABASE_ANON_KEY`) in the Cloudflare Pages project settings.
5. Deploy.

---

## How roles work

- Everyone who signs up gets `role = 'user'` by default.
- The **first** admin is granted by editing their row directly in the
  Supabase Table Editor (step 3 above) — matches the "admin only via
  DB edit" requirement from the spec, and closes off any
  privilege-escalation path through the app itself.
- **Co-admins**: any existing admin can go to **Admin → Co-admins** and
  add another person's email. A database trigger then automatically
  sets that person's `role` to `admin` — immediately if they already
  have an account, or the moment they sign up if they don't yet.
  Co-admins have full admin access, same as the original admin.

## WhatsApp payment hand-off

- The number customers send payment screenshots to is
  **+237690409736** by default, stored in the `settings` table
  (`key = 'whatsapp_number'`).
- It's shown on the order confirmation screen right after checkout,
  on the "Comment ça marche" page (step 2), and on the Contact page.
- Change it anytime from **Admin → Réglages** — no redeploy needed.

## Requirement field types (admin catalog manager)

When adding a field to a service (**Admin → Catalogue** → select a
service → "+ Ajouter un champ"), the admin picks one of:

| Type | Behaviour |
|---|---|
| `short_text` | single-line text input |
| `long_text` | multi-line textarea |
| `date` | date picker |
| `file_image` | single image upload |
| `file_pdf` | single PDF upload |
| `file_multi` | multiple files, any accepted format |

The catalog manager currently uses simple browser prompts for adding
categories/sections/services/fields, to keep v1 lean — swap these for
proper modal forms whenever you're ready to polish the UI.

## What's intentionally simple in v1 (per your "basic styling, I'll
## polish it myself" instruction)

- Plain Tailwind utility classes, no custom design system.
- No animations/transitions beyond hover states.
- Admin catalog CRUD uses `prompt()`/`confirm()` dialogs instead of
  full modal forms — fast to build, easy to replace.
- Cart lives in memory only (not persisted across a hard refresh),
  since it can hold `File` objects that can't be saved to
  localStorage. If that becomes a problem, swap it for IndexedDB.

## Project structure

```
src/
  components/     shared UI (Navbar, Footer, RequirementField, guards…)
  context/        Auth, Cart, Language (FR/EN) React contexts
  lib/            small helpers (WhatsApp link builder)
  pages/          one file per public page
  pages/admin/    admin panel pages (dashboard, requests, catalog, co-admins, settings)
supabase/
  migrations/     SQL schema + RLS policies + triggers (run once)
  seed.sql        example catalog data (optional, for testing)
  functions/      optional Edge Function stub (not wired up by default)
```

## Open items from the original spec (non-blocking, your call)

- Exact brand hex codes — `tailwind.config.js` currently uses values
  approximated from the logo; swap them in one place anytime.
- FAQ / Privacy / Terms page copy is placeholder text — replace in
  `src/pages/FAQ.jsx`, `Privacy.jsx`, `Terms.jsx`.
- No email notifications in v1 (confirmed pull-based only) — Suivi /
  Mes commandes is how customers check status.
- No in-app payment gateway in v1 (confirmed) — WhatsApp hand-off as
  specced.
