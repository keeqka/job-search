# Local Job Search CRM

A minimal, local-first web app for tracking your job search: applications,
companies, contacts, interviews, offers, CV versions and tasks — all in one
place, backed by a Google Sheet you own.

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + React
  Router + TanStack Query + TanStack Table + Recharts
- **Backend**: Google Apps Script (a thin REST-like API) reading and writing a
  Google Sheet — no database, no server to host, no auth to configure

```
React  →  Google Apps Script API  →  Google Sheets
```

This is a single-user, local tool. There is no login, no multi-tenant
support, and nothing to deploy beyond the Apps Script web app itself.

## 1. Install dependencies

```bash
npm install
```

## 2. Create the Google Spreadsheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new,
   blank spreadsheet. Name it something like **Job Search CRM**.
2. You don't need to create any sheets/tabs or headers by hand — the Apps
   Script backend creates the 7 sheets it needs (`Applications`, `Companies`,
   `Contacts`, `Interviews`, `Offers`, `CV Versions`, `Tasks`) and writes the
   header row automatically the first time it runs (see step 5).

## 3. Create the Google Apps Script

1. In your new spreadsheet, open **Extensions → Apps Script**. This creates a
   script bound to the spreadsheet (it can read/write it without extra auth
   setup).
2. Delete the default `Code.gs` boilerplate and paste in the contents of
   [`google-apps-script/Code.gs`](./google-apps-script/Code.gs) from this
   repo.
3. Save the project (e.g. name it "Job Search CRM API").

## 4. Deploy it as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure:
   - **Execute as**: Me (your account)
   - **Who has access**: Anyone
     (this doesn't make your data public — the URL is a long, unguessable
     token, but treat it like a secret anyway; anyone with the exact URL
     could read/write your sheet)
4. Click **Deploy**, authorize the script when prompted (it only touches
   this one spreadsheet), and copy the **Web app URL** it gives you —
   it looks like `https://script.google.com/macros/s/AKfycb.../exec`.

If you change `Code.gs` later, use **Deploy → Manage deployments → Edit →
New version** so the change is picked up by the existing URL.

> **Already deployed an earlier version?** The Settings → Danger Zone "Delete
> all data" button needs the `clearAllData` handler in the current `Code.gs`.
> Paste the latest file into your Apps Script project and redeploy a new
> version, or that one button will fail with an error while everything else
> keeps working.

## 5. Initialize the sheets

Open the Web app URL you just copied in your browser, appending
`?resource=__init`, e.g.:

```
https://script.google.com/macros/s/AKfycb.../exec?resource=__init
```

This creates all 7 sheets with their header rows if they don't exist yet.
(You can skip this — the app creates sheets lazily on first write — but it's
a good way to confirm the deployment works before wiring up the frontend.)

## 6. Configure the API URL

Copy `.env.example` to `.env` and set `VITE_API_URL` to the Web app URL from
step 4:

```bash
cp .env.example .env
```

```
VITE_API_URL=https://script.google.com/macros/s/AKfycb.../exec
```

The URL is only ever read from this environment variable — it's never
hardcoded in the frontend source.

## 7. Start the app

```bash
npm run dev
```

Open the printed local URL. On first run the app will be empty — either add
your first company/application by hand, or click **Load demo data** in the
sidebar (visible in dev builds only) to populate the sheet with a handful of
sample companies, applications, contacts, interviews and an offer so you can
try out every screen immediately.

## Why GET/POST only, no PUT/DELETE?

Google Apps Script web apps only expose two entry points, `doGet(e)` and
`doPost(e)` — there's no native way to handle a real HTTP `PUT` or `DELETE`,
and Apps Script can't answer a CORS preflight (`OPTIONS`) request with the
right headers, so a literal `fetch(url, { method: 'DELETE' })` from the
browser would fail. To work around this without ever triggering a preflight,
every write goes through `POST` with a `text/plain` body (a "simple request"
per the CORS spec), and the intended verb travels inside the JSON payload:

```json
{ "resource": "applications", "method": "PUT", "id": "app_123", "data": { "status": "Offer" } }
```

`src/lib/api/client.ts` and `google-apps-script/Code.gs` implement this
contract on the frontend and backend sides respectively — you shouldn't need
to think about it unless you're extending the API.

## Project structure

```
src/
├── components/       # Shared UI (shadcn/ui primitives + app-level widgets)
├── features/          # One folder per entity: hooks, forms, feature-specific UI
│   ├── applications/
│   ├── companies/
│   ├── contacts/
│   ├── interviews/
│   ├── offers/
│   ├── tasks/
│   └── cv-versions/
├── pages/             # Route-level components
├── hooks/             # Generic cross-feature hooks (TanStack Query wrappers)
├── lib/
│   ├── api/           # Google Apps Script API client
│   ├── utils/         # Computed fields (days since, salary range, stats)
│   └── chart-colors.ts
├── types/              # Shared entity types & enums
└── App.tsx

google-apps-script/
└── Code.gs             # The entire backend — paste into Apps Script as-is
```

## What this app is not

By design, there's no authentication, no multi-user support, no database,
no Docker, no deployment pipeline, and no AI features. It's a personal,
local tool you can start using today — not a SaaS product.
