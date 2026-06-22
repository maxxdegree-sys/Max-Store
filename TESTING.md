# Al Rafiq Shopping Centre — Testing Guide

Complete reference for testing all portals, routes, accounts, and flows.

---

## Prerequisites

### Environment

Create `server/.env` with at least:

```env
DATABASE_URL=postgresql://...   # Neon/PostgreSQL connection string
JWT_SECRET=your-secret-here       # Required for auth tokens
PORT=4000                         # Optional (default 4000)
SITE_URL=http://localhost:5173    # Optional
```

### Start the application

```powershell
cd "c:\Users\Ideat\Downloads\New folder\New folder"
npm run dev:all
```

| Service   | URL                          |
|-----------|------------------------------|
| Storefront | http://localhost:5173     |
| Admin      | http://localhost:5173/admin/login |
| Vendor     | http://localhost:5173/vendor/login |
| API        | http://localhost:4000/api/health |

**Health check:** `GET http://localhost:4000/api/health` should return `"ok": true` and `"db": true`.

---

## Portal overview

| Portal     | Login route        | Base route   | Auth token storage        |
|------------|--------------------|--------------|---------------------------|
| Storefront | `/login`           | `/`          | `alrafiq-customer-token`  |
| Admin      | `/admin/login`     | `/admin`     | `alrafiq-token`           |
| Vendor     | `/vendor/login`    | `/vendor`    | `alrafiq-vendor-token`    |

Each portal uses a **separate JWT**. You can be logged into storefront and admin at the same time in the same browser.

---

## Accounts & passwords

### Admin accounts (seeded in database)

| Name              | Email                         | Password       | Role            | Can access |
|-------------------|-------------------------------|----------------|-----------------|------------|
| Store Owner       | `Alrafiqshopping56@gmail.com` | `alrafiq123`   | Executive       | All admin pages + Team + impersonation |
| Imran (Catalog)   | `products@alrafiq.pk`         | `products123`  | Product Manager | Dashboard, Products |
| Ayesha (Support)  | `support@alrafiq.pk`          | `support123`   | Support Agent   | Dashboard, Complaints, Reviews |
| Usman (Accounts)  | `accounts@alrafiq.pk`         | `accounts123`  | Accountant      | Dashboard, Accounts, Orders, Exports |

**Login:** http://localhost:5173/admin/login

**Role access matrix (what each role should / should not see):**

| Admin route              | Executive | Product Mgr | Support | Accountant |
|--------------------------|:---------:|:-----------:|:-------:|:----------:|
| `/admin` (Dashboard)     | ✓         | ✓           | ✓       | ✓          |
| `/admin/products`        | ✓         | ✓           | ✗       | ✗          |
| `/admin/orders`          | ✓         | ✗           | ✗       | ✓          |
| `/admin/customers`       | ✓         | ✗           | ✗       | ✗          |
| `/admin/banners`         | ✓         | ✗           | ✗       | ✗          |
| `/admin/content`         | ✓         | ✗           | ✗       | ✗          |
| `/admin/coupons`         | ✓         | ✗           | ✗       | ✗          |
| `/admin/reviews`         | ✓         | ✗           | ✓       | ✗          |
| `/admin/complaints`      | ✓         | ✗           | ✓       | ✗          |
| `/admin/accounts`        | ✓         | ✗           | ✗       | ✓          |
| `/admin/exports`         | ✓         | ✗           | ✗       | ✓          |
| `/admin/blog`            | ✓         | ✗           | ✗       | ✗          |
| `/admin/email`           | ✓         | ✗           | ✗       | ✗          |
| `/admin/vendors`         | ✓         | ✗           | ✗       | ✗          |
| `/admin/listing-requests`| ✓         | ✗           | ✗       | ✗          |
| `/admin/team`            | ✓         | ✗           | ✗       | ✗          |
| `/admin/activity`        | ✓         | ✗           | ✗       | ✗          |

> Marketing Manager, SEO Manager, and Content Writer presets exist in code but are not seeded by default.

### Vendor account (seeded in database)

| Name    | Email                        | Password      | Notes                          |
|---------|------------------------------|---------------|--------------------------------|
| Samsung | `samsung@vendor.alrafiq.pk`  | `samsung123`  | Manages products `p7`, `p8`    |

**Login:** http://localhost:5173/vendor/login

### Customer accounts (storefront)

No default customer account is seeded with a password. Options:

1. **Register** at http://localhost:5173/register (name, email, password ≥ 6 chars)
2. **Guest checkout** — creates a customer record without login; register later with the same email to claim it

**Tip:** Use the **same phone number** at checkout and on your profile so orders appear under **My Orders** in the dashboard.

---

## Portal routes

### Storefront routes

| Route                    | Purpose                          |
|--------------------------|----------------------------------|
| `/`                      | Home                             |
| `/shop`                  | Product catalog                  |
| `/categories`            | Category listing                 |
| `/category/:slug`        | Products by category             |
| `/product/:slug`         | Product detail + reviews         |
| `/cart`                  | Shopping cart + coupon           |
| `/checkout`              | Place order (COD)                |
| `/wishlist`              | Saved products                   |
| `/login`                 | Customer login                   |
| `/register`              | Customer registration            |
| `/dashboard`             | Account overview                 |
| `/dashboard/orders`      | Order history                    |
| `/dashboard/profile`     | Edit name, phone, city           |
| `/dashboard/addresses`   | Saved shipping addresses         |
| `/dashboard/wishlist`    | Wishlist (logged-in)             |
| `/dashboard/notifications` | Order notifications            |
| `/dashboard/security`    | Change password                  |
| `/order-tracking`        | Track order by ID                |
| `/complaint`             | Submit support ticket            |
| `/track-ticket`          | Track ticket by ID               |
| `/blog`                  | Blog listing                     |
| `/blog/:slug`            | Blog post                        |
| `/about`                 | About page                       |
| `/contact`               | Contact page                     |
| `/faq`                   | FAQ (static content)             |
| `/privacy-policy`        | Privacy policy                   |
| `/terms`                 | Terms of service                 |

### Admin routes

| Route                      | Purpose                              |
|----------------------------|--------------------------------------|
| `/admin/login`             | Admin login                          |
| `/admin`                   | Dashboard                            |
| `/admin/products`          | Product CRUD                         |
| `/admin/orders`            | Order management                     |
| `/admin/customers`         | Customer CRM                         |
| `/admin/banners`           | Hero / promo banners                 |
| `/admin/content`           | Site announcements, testimonials     |
| `/admin/coupons`           | Discount codes                       |
| `/admin/reviews`           | Moderate product reviews             |
| `/admin/complaints`        | Support tickets                      |
| `/admin/accounts`          | Income / expense ledger              |
| `/admin/exports`           | Export data (CSV, XLSX, PDF)         |
| `/admin/blog`              | Blog posts + AI SEO tools            |
| `/admin/email`             | Email contacts & campaigns (DB)      |
| `/admin/vendors`           | Vendor account management            |
| `/admin/listing-requests`  | Approve vendor product proposals     |
| `/admin/team`              | Admin user management (Executive)    |
| `/admin/activity`          | Audit / activity log                 |

### Vendor routes

| Route                      | Purpose                              |
|----------------------------|--------------------------------------|
| `/vendor/login`            | Vendor login                         |
| `/vendor`                  | Vendor dashboard                     |
| `/vendor/products`         | Own products                         |
| `/vendor/orders`           | Orders containing vendor SKUs        |
| `/vendor/listing-requests` | Submit new product proposals         |

---

## Seeded test data

### Coupon codes

| Code        | Discount | Min order (PKR) |
|-------------|----------|-----------------|
| `WELCOME10` | 10%      | 1,500           |
| `EID20`     | 20%      | 3,000           |
| `KHARIAN15` | 15%      | 2,000           |

Coupons are validated in the cart **and re-validated at checkout**. Usage count increments in the database after a successful order.

---

## Testing flows

### 1. Storefront — guest shopping

| Step | Action | Verify |
|------|--------|--------|
| 1 | Open `/shop`, click a product | Product loads from API |
| 2 | Add to cart → `/cart` | Cart persists after page refresh |
| 3 | Apply coupon `WELCOME10` (cart ≥ PKR 1,500) | Discount shown |
| 4 | Go to `/checkout`, fill name, phone, address | Form validates |
| 5 | Place order | Order ID like `ARS-...` shown |
| 6 | Open `/order-tracking?id=<orderId>` | Status “Placed”, timeline visible |
| 7 | Log in to admin → `/admin/orders` | New order appears |

### 2. Storefront — customer account

| Step | Action | Verify |
|------|--------|--------|
| 1 | `/register` with new email + password | Redirected / logged in |
| 2 | Add items to wishlist | Saved locally + synced to DB |
| 3 | `/dashboard/addresses` — add address | Address saved |
| 4 | Checkout using **same phone** as profile | Order appears in `/dashboard/orders` |
| 5 | `/dashboard/security` — change password | Can log in with new password |

### 3. Storefront — support & content

| Step | Action | Verify |
|------|--------|--------|
| 1 | `/complaint` — submit ticket | Ticket ID like `AR-2026-xxxx` |
| 2 | `/track-ticket` — enter ID | Status visible |
| 3 | Product page — submit review | Pending in `/admin/reviews` |
| 4 | Footer newsletter signup | Contact saved (visible in `/admin/email`) |
| 5 | `/blog` — open a post | Content from database |

### 4. Admin — Executive (full access)

Login: `Alrafiqshopping56@gmail.com` / `alrafiq123`

| Step | Action | Verify |
|------|--------|--------|
| 1 | `/admin/products` — create product | Appears in `/shop` after refresh |
| 2 | `/admin/orders` — update delivery status | Customer tracking shows new timeline |
| 3 | `/admin/complaints` — open ticket, assign staff | Sidebar badge updates; assignee list shows all admins |
| 4 | `/admin/coupons` — create code | Valid in cart |
| 5 | `/admin/email` — load contacts, send campaign | Campaign saved in “Past campaigns” |
| 6 | `/admin/team` — add user | New user can log in |
| 7 | Impersonate support user | Limited menu; exit returns to Executive |
| 8 | `/admin/listing-requests` — approve vendor request | Product live on storefront |
| 9 | `/admin/activity` | Audit entries for above actions |

### 5. Admin — role-restricted accounts

Test each account and confirm **allowed pages load** and **restricted pages show “Access restricted”**:

- **Product Manager** (`products@alrafiq.pk` / `products123`) → products only
- **Support** (`support@alrafiq.pk` / `support123`) → complaints, reviews
- **Accountant** (`accounts@alrafiq.pk` / `accounts123`) → accounts, orders, exports

### 6. Vendor portal

Login: `samsung@vendor.alrafiq.pk` / `samsung123`

| Step | Action | Verify |
|------|--------|--------|
| 1 | `/vendor/products` | Shows 2 Samsung products |
| 2 | Place storefront order for a Samsung product | Order in `/vendor/orders` |
| 3 | `/vendor/listing-requests` — submit proposal | Pending in `/admin/listing-requests` |
| 4 | Admin approves request | Product appears in vendor + storefront |

---

## API smoke tests (PowerShell)

```powershell
# Health
Invoke-RestMethod http://localhost:4000/api/health

# Admin login
$body = '{"email":"Alrafiqshopping56@gmail.com","password":"alrafiq123"}'
$r = Invoke-RestMethod -Uri "http://localhost:4000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
$h = @{ Authorization = "Bearer $($r.token)" }

# List products
Invoke-RestMethod -Uri "http://localhost:4000/api/products/all" -Headers $h

# Vendor login
$vb = '{"email":"samsung@vendor.alrafiq.pk","password":"samsung123"}'
$vr = Invoke-RestMethod -Uri "http://localhost:4000/api/vendor/auth/login" -Method POST -ContentType "application/json" -Body $vb

# Checkout with coupon
$order = '{"order":{"customerName":"Test","customerPhone":"03001234567","city":"Kharian","items":[{"sku":"p1","name":"Test","qty":1,"price":2000}],"couponCode":"WELCOME10","shipping":0}}'
Invoke-RestMethod -Uri "http://localhost:4000/api/orders/checkout" -Method POST -ContentType "application/json" -Body $order
# Expected: discount=200, total=1800
```

---

## Regression checklist (DB persistence)

After each action, refresh the page or re-login and confirm data is still there:

- [ ] Product create / edit / delete (admin)
- [ ] Order checkout → admin orders → customer tracking
- [ ] Customer register → profile → address CRUD
- [ ] Complaint submit → admin update → customer track page
- [ ] Review submit → admin approve → visible on product page
- [ ] Coupon create → validate in cart → checkout applies discount
- [ ] Banner / site content → visible on homepage
- [ ] Blog publish → visible on `/blog`
- [ ] Vendor listing → admin approve → storefront product
- [ ] Finance transaction add / delete
- [ ] Email contact import → campaign send → past campaigns list

---

## Known limitations

| Item | Behaviour |
|------|-----------|
| Cart | Stored in browser `localStorage` only (not synced to server) |
| FAQ content | Static file — not editable in admin |
| Category names | Static list — product counts are dynamic from DB |
| Email delivery | Opens mail app (BCC batches) — no SMTP auto-send |
| Customer orders | Matched by phone number in dashboard |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| API returns errors / empty data | Check `DATABASE_URL` in `server/.env`; confirm `/api/health` shows `"db": true` |
| Admin login fails | Use seeded emails exactly (case-insensitive for email) |
| Orders missing in customer dashboard | Use the same phone at checkout as on your account |
| Coupon rejected at checkout | Ensure cart subtotal meets minimum order amount |
| Port already in use | Stop other Node processes or change `PORT` in `server/.env` |

---

*Al Rafiq Shopping Centre — Kharian, Pakistan*
