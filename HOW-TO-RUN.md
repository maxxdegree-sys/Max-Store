# Al Rafiq Shopping Centre - How to Run

The project now has **two parts**:

1. **Frontend** (the website) - React + Vite, runs on `http://localhost:5173`
2. **Backend** (the API) - Node + Express, runs on `http://localhost:4000`

The website works on its own. The **backend powers the new advanced features**:
smart product import, image uploads, exports, and the secure audit log.

---

## First time setup (run once)

Open a terminal **in the project folder** and run:

```
npm run setup
```

This installs the website packages **and** the backend packages
(it runs `npm install` in both the main folder and the `server` folder).

> If `npm run setup` ever fails, you can do the two steps manually:
> ```
> npm install
> npm install --prefix server
> ```

---

## Start everything (every day)

```
npm run dev:all
```

This starts the **website and the backend together** in one window.

- Website: open `http://localhost:5173`
- API health check: open `http://localhost:4000/api/health`

Press `Ctrl + C` to stop.

> Prefer two windows? Run `npm run client` in one and `npm run server` in another.
> Want only the website (no advanced features)? Just run `npm run dev` as before.

---

## Admin login (backend accounts)

Open `http://localhost:5173/admin/login`

| Role            | Email                          | Password      |
|-----------------|--------------------------------|---------------|
| Executive (all) | Alrafiqshopping56@gmail.com    | alrafiq123    |
| Product Manager | products@alrafiq.pk            | products123   |
| Support Agent   | support@alrafiq.pk             | support123    |
| Accountant      | accounts@alrafiq.pk            | accounts123   |

**Change these passwords before going live.** They are set in
`server/src/seed.js`. Delete `server/data/db.json` to re-seed from scratch.

If the backend is **not** running, admin login still works in "demo mode"
(local only), but the smart-import / upload / export features will be off.

---

## What needs the backend

- **Smart product import** (Products > Import from URL) - Executives, or team
  members an Executive has granted, only.
- **Revenue & profitability analytics** - shown to Executives only; other roles
  see operational metrics instead.
- **Product image uploads** (Products > edit > drag & drop).
- **Export center** (Exports) - Excel / CSV / watermarked PDF for customers,
  orders and products, with an export audit log.
- **Blog & SEO module** (Blog & SEO) - AI-assisted blog CMS with real-time SEO
  scoring, schema generation and the AI suggestion sidebar.
- The complaint **audit timeline** and the overall audit log.

---

## AI Blog & SEO module

Open the admin **Blog & SEO** section to write posts with an AI sidebar
(generate drafts, SEO titles, meta descriptions, FAQs, keywords, plus content
scoring, semantic analysis and internal-link ideas) and a live SEO score panel.

By default the AI runs in **sample mode** - it produces realistic placeholder
content and *real* analysis (readability, SEO score, schema) with no API key
required. To switch on the live Claude API later:

1. Copy `server/.env.example` to `server/.env`.
2. Set `USE_REAL_AI=true` and paste your Anthropic key into `CLAUDE_API_KEY`.
3. Restart the backend.

Posts you publish here appear on the public `/blog` pages automatically.

---

## Notes

- The backend stores data in `server/data/db.json` (created automatically).
- Uploaded images will be stored in `server/data/uploads/`.
- The login token (JWT) expires after 12 hours.
- For production, set environment variables `JWT_SECRET` and `PORT`, and host
  the API behind HTTPS. The frontend talks to the API via the `/api` path
  (proxied to port 4000 in development - see `vite.config.js`).

