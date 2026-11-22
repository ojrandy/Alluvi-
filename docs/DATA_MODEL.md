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
Tokens are single-use and expire after 30 minutes. Only the hash is stored.

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
| payment_method | text default `bank_transfer` | |
| tracking_number | text null | |
| customer_note | text null | |
| internal_note | text null | admin-only |
| ruo_accepted_at | timestamptz | compliance evidence |
| ip_hash | text null | sha256 of IP + secret, for abuse tracking |

### `order_items`
| id uuid PK | order_id FK (cascade) | product_id FK null (set null) | product_name text | product_slug text | unit_price_pence int | quantity int > 0 | line_total_pence int |

### `order_events`
| id uuid PK | order_id FK (cascade) | type text (`created`,`status_changed`,`email_sent`,`email_failed`,`note`) | data jsonb | actor text (`system`/admin email) | created_at |

### `rate_limits`
| key varchar(191) PK (e.g. `login:<ipHash>`) | count int | reset_at datetime |
Fixed-window counters stored in the DB, because Passenger can run several worker processes and an in-memory limiter would not be shared.

### `settings`
| key text PK | value jsonb | updated_at |
Keys: `bank_details` `{accountName, sortCode, accountNumber, bankName}`,
`shipping_options` `[{key, label, pricePence, freeOverPence?}]`, `notify_email`.

## Order state machine

```
pending_payment ──▶ paid ──▶ processing ──▶ shipped ──▶ completed
       │              │           │
       └──────────────┴───────────┴──▶ cancelled
```
Allowed transitions are enforced in `src/server/actions/orders.ts`, not in the UI.
Cancelling restores stock.

## Seeding
`npm run content:products` builds `content/products.json` from the scrape. `npm run db:seed` **inserts only what is missing** and never overwrites prices, stock or settings, so it is safe to run in production. `--force` refreshes catalogue copy, specs and images for existing products only. Seeded stock is a random placeholder between 50 and 100 until the admin sets real stock. The `free_shipping_promo` setting `{startsAt, endsAt, label}` is seeded as 60 days from the first seed, which is launch day.

## MariaDB compatibility
- Drizzle runs in `mode: "planetscale"` (src/db/index.ts). In `default` mode, relational queries (`db.query.*.findMany({ with })`) use `LATERAL` joins, which **MariaDB does not support**.
- JSON columns are LONGTEXT in MariaDB. Drizzle parses them back into objects (verified).
- CHECK constraints and FKs are enforced (verified on MariaDB 10.11).

## Indexes
`orders(created_at desc)`, `orders(status)`, `orders(email)`, `orders(customer_id)`, `order_items(order_id)`,
`products(is_active, sort_order)`.
