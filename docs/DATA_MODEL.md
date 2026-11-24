# Data Model

> Source of truth for the database. Implementation lives in `src/db/schema.ts` (Drizzle).
> If you change one, change the other in the same task.

## Conventions
- **MySQL / MariaDB** (Namecheap cPanel, ADR-010), `snake_case` columns, `utf8mb4`.
- Primary keys: `char(36)` UUIDs generated in app with `crypto.randomUUID()` (Drizzle `$defaultFn`).
- **Money = integer pence** (`price_pence`), currency fixed to GBP.
- `created_at` / `updated_at` `datetime` (UTC) on every table; `updated_at` uses `.onUpdateNow()`.
- `jsonb` in the tables below means MySQL `json`. `timestamptz` means `datetime` stored in UTC.
- Soft-archive products (`is_active=false`); never hard-delete anything an order references.
- Order items **snapshot** product name, slug and unit price at purchase time.

## ERD

```
products 1──* product_images
products 1──* order_items *──1 orders 1──* order_events
customers 0..1──* orders            (null customer_id = guest order)
customers 1──* customer_tokens      (password reset / email verify)
settings (key/value json)
```

### `customers`
| Column | Type | Notes |
|---|---|---|
| id | char(36) PK | |
| email | varchar(255) unique | lower-cased |
| password_hash | varchar(100) | bcrypt cost 12 |
| first_name, last_name, phone | varchar | |
| default_address | json null | `{line1, line2, city, postcode, country}` |
| email_verified_at | datetime null | Set by verify/reset token flow; required before guest orders are linked |
| last_login_at | datetime null | |

### `customer_tokens`
| id char(36) PK | customer_id FK (cascade) | type enum(`reset_password`,`verify_email`) | token_hash char(64) (sha256) unique | expires_at datetime | used_at datetime null |
Tokens are single-use and expire after 30 minutes. Only the hash is stored. Issuing a token deletes earlier ones of the same type for that customer. A `customer_linked` order event records each guest order attached to an account after email verification (`data: {customerId, via}`).

## Tables

### `products`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| slug | text unique | Must match live URLs (`glow-70mg`, `bpc-157-tb-500-40mg`, …) |
| name | text | |
| short_description | text | Card / meta description |
| description | text | Markdown |
| price_pence | integer | > 0 |
| compare_at_pence | integer null | Strike-through price |
| stock | integer | ≥ 0 |
| category | text null | `Research compound` / `Support` (from live page label) |
| badge | varchar(50) null | e.g. `New arrival` |
| lab_report_url | text null | Janoshik verification link |
| specs | json | `ProductSpecs` in schema.ts: `{ batchNumber, fillVolume, purity, dateTested, compounds[{compound, concentration, verifiedContent}], packageContents[], labReports[{label,url}], disclaimer, safetyNote, relatedSlugs[] }` |
| is_active | boolean default true | |
| sort_order | integer default 0 | |

### `product_images`
| id uuid PK | product_id FK → products (cascade) | url text | alt text | sort_order int |

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| order_no | text unique | `ALV-` + 6 chars from `23456789ABCDEFGHJKLMNPQRSTUVWXYZ` |
| status | enum `order_status` | see state machine |
| customer_id | FK → customers null (set null) | null = guest checkout |
| email | text | lower-cased |
| first_name, last_name, phone | text | |
| address_line1, address_line2, city, postcode, country | text | country default `GB` |
| shipping_method | text | key from settings |
| subtotal_pence, shipping_pence, total_pence | integer | computed server-side |
| payment_method | varchar(30) default `bank_transfer` | key from `src/lib/payment-methods.ts` chosen at checkout (ADR-021); `bank_transfer` = UK bank transfer |
| payment_method_label | varchar(80) null | name snapshot at checkout |
| payment_instructions | text null | exact payment details last emailed to the customer (shown on their gated order page) |
| payment_instructions_sent_at | datetime null | set only after SMTP accepted the details email |
| payment_reminder_sent_at | datetime null | last reminder; cleared when details are re-sent |
| customer_reported_paid_at | datetime null | customer pressed "I've sent payment" (not proof) |
| customer_payment_ref | varchar(120) null | optional reference the customer gave |
| tracking_number | text null | |
| customer_note | text null | |
| internal_note | text null | admin-only |
| ruo_accepted_at | timestamptz | compliance evidence |
| ip_hash | text null | sha256 of IP + secret, for abuse tracking |

### `order_items`
| id uuid PK | order_id FK (cascade) | product_id FK null (set null) | product_name text | product_slug text | unit_price_pence int | quantity int > 0 | line_total_pence int |

### `order_events`
| id uuid PK | order_id FK (cascade) | type text (`created`,`status_changed`,`email_sent`,`email_failed`,`note`,`customer_linked`,`payment_instructions_sent`,`payment_reminder_sent`,`customer_reported_paid`) | data jsonb | actor text (`system`/admin email/`customer`) | created_at |

`status_changed` events **must** store `data: { from, to }` (order statuses). `/track-order` builds the customer timeline from them (`getOrderStatusChanges`); only the status and time are shown, never the actor or other data.

Event `data` shapes written by the admin (D2-3, actor = admin email):
- `status_changed`: `{ from, to, trackingNumber? (set when shipping), restocked?: [{productId, quantity}] (on cancel) }`
- `note`: `{ field: "tracking_number", from, to }` or `{ field: "internal_note", cleared }` (the note text lives on the order only)
- `email_sent` / `email_failed`: `{ template: "order-received" | "admin-new-order" | "order-shipped" | "admin-payment-reported" | "payment-instructions" | "payment-reminder", messageId | error }`
- `payment_instructions_sent`: `{ method, resend, messageId }` · `payment_reminder_sent`: `{ messageId }` (ADR-021)

Written by the customer (actor `customer`): `customer_reported_paid`: `{ reference | null, repeat }`. `created` also records `paymentMethod`.

**Payment stage** (ADR-021) is derived for `pending_payment` orders, never stored: `needs_details` (no details sent) → `awaiting_payment` (sent) → `customer_reported`; `overdue` = sent ≥ 5 days ago with no report. Same rule in `paymentStage()` (src/lib/payment-methods.ts) and `paymentStageWhere()` (src/server/queries/admin-orders.ts).

### `rate_limits`
| key varchar(191) PK (e.g. `login:<ipHash>`) | count int | reset_at datetime |
Fixed-window counters stored in the DB, because Passenger can run several worker processes and an in-memory limiter would not be shared.

### `settings`
| key text PK | value jsonb | updated_at |
Keys: `payment_methods` `[{key, enabled, template}]` (ADR-021; templates hold the admin's real payment details, never shown publicly; methods missing from the array are enabled with the default template; `bank_details` was removed in migration 0001),
`shipping_options` `[{key, label, description?, pricePence, freeOverPence?}]` (keys starting `uk_` are UK only), `notify_email` (falls back to `ORDER_NOTIFY_EMAIL`),
`free_shipping_promo` `{label, startsAt, endsAt, enabled?}` (whole London days; `enabled:false` = off, row kept so a re-seed does not re-enable it).
All edited in `/admin/settings` and read per request (`src/server/settings.ts`, never cached).

## Order state machine

```
pending_payment ──▶ paid ──▶ processing ──▶ shipped ──▶ completed
       │              │           │
       └──────────────┴───────────┴──▶ cancelled
```
The map lives in `src/lib/order-transitions.ts` (the admin UI uses it to offer only legal moves); it is
enforced in `src/server/actions/orders.ts` under a row lock, never trusted from the UI. No step can be skipped
(e.g. paid → shipped must go through processing). `completed` and `cancelled` are final.
Cancelling restores stock for every line whose product still exists.

## Dashboard metrics
Computed in `src/server/queries/admin.ts` (never cached). Used by the `/admin` overview.
- **Days are London calendar days.** "Today" starts at 00:00 UK time (23:00 UTC in BST). "7 days" = today + the previous 6 days; "30 days" likewise. Bounds are computed in `src/lib/london-day.ts` and passed to SQL as UTC instants.
- **Orders** = every order placed in the window, whatever its status (cancelled included).
- **Revenue** = `SUM(total_pence)` of orders placed in the window with status `paid`, `processing`, `shipped` or `completed` (payment received). Pending and cancelled orders are excluded. It is attributed to the order date, not the payment date.
- **Pending payments** = all orders currently `pending_payment`, any age (count + total).
- **Previous period** (change indicators) = the same-length window immediately before: days -13…-7 for 7 days, -59…-30 for 30 days.
- **Average order value (30 days)** = 30-day revenue ÷ paid orders placed in the window.
- **Top products** = `SUM(line_total_pence)` of order lines from paid-status orders in the last 30 days, grouped by product slug (line snapshots, so renamed or deleted products still count).
- **Low stock** = active products with stock ≤ 5.
- The sales chart loads 180 days (90 shown + 90 for comparison); it groups by UTC hour in SQL and folds hours into London days in JS. This avoids `CONVERT_TZ`, which needs MySQL time-zone tables that shared hosting often lacks.

Manual check (replace the bounds with London midnight expressed in UTC):
```sql
SELECT COUNT(*) FROM orders WHERE created_at >= '<today 00:00 UK in UTC>';
SELECT SUM(total_pence) FROM orders
 WHERE created_at >= '<start of 7-day window in UTC>' AND status IN ('paid','processing','shipped','completed');
SELECT COUNT(*), SUM(total_pence) FROM orders WHERE status = 'pending_payment';
```

## Seeding
`npm run content:products` builds `content/products.json` from the scrape. `npm run db:seed` **inserts only what is missing** and never overwrites prices, stock or settings, so it is safe to run in production. `--force` refreshes catalogue copy, specs and images for existing products only. Seeded stock is a random placeholder between 50 and 100 until the admin sets real stock. The `free_shipping_promo` setting `{startsAt, endsAt, label}` is seeded as 60 days from the first seed, which is launch day.

## MariaDB compatibility
- Drizzle runs in `mode: "planetscale"` (src/db/index.ts). In `default` mode, relational queries (`db.query.*.findMany({ with })`) use `LATERAL` joins, which **MariaDB does not support**.
- JSON columns are LONGTEXT in MariaDB. Drizzle parses them back into objects (verified).
- CHECK constraints and FKs are enforced (verified on MariaDB 10.11).

## Indexes
`orders(created_at desc)`, `orders(status)`, `orders(email)`, `orders(customer_id)`, `order_items(order_id)`,
`products(is_active, sort_order)`.
