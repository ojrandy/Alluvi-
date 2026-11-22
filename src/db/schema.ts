/**
 * Database schema: source of truth is docs/DATA_MODEL.md (keep both in sync).
 * MySQL / MariaDB (Namecheap cPanel). Money is integer pence. Datetimes are stored in UTC.
 *
 * NOTE: no `server-only` import here so CLI scripts (seed, migrate) can use the schema.
 * Runtime DB access goes through src/db/index.ts, which IS server-only.
 */
import { relations, sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// ---------- helpers ----------

const id = () =>
  char("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: datetime("created_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime("updated_at", { mode: "date" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdate(() => new Date()),
};

// ---------- JSON shapes ----------

export type CompoundAnalysis = {
  compound: string;
  concentration: string | null; // e.g. "8.48 mg/ml"
  verifiedContent: string | null; // e.g. "22.05 mg"
};

export type LabReport = { label: string; url: string };

export type ProductSpecs = {
  batchNumber?: string | null;
  fillVolume?: string | null;
  purity?: string | null;
  dateTested?: string | null;
  compounds?: CompoundAnalysis[];
  packageContents?: string[];
  labReports?: LabReport[];
  /** Mandatory disclaimer + safety line shown on the product page (verbatim from live site). */
  disclaimer?: string | null;
  safetyNote?: string | null;
  /** "Continue your research" cross-sells, by slug. */
  relatedSlugs?: string[];
};

export type Address = {
  line1: string;
  line2?: string | null;
  city: string;
  postcode: string;
  country: string;
};

export type ShippingOption = {
  key: string;
  label: string;
  description?: string;
  pricePence: number;
  freeOverPence?: number | null;
};

export type BankDetails = {
  accountName: string;
  bankName: string;
  sortCode: string;
  accountNumber: string;
  iban?: string | null;
  instructions?: string | null;
};

// ---------- enums ----------

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "completed",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_EVENT_TYPES = [
  "created",
  "status_changed",
  "email_sent",
  "email_failed",
  "note",
  "customer_linked",
] as const;

export const CUSTOMER_TOKEN_TYPES = ["reset_password", "verify_email"] as const;

// ---------- catalogue ----------

export const products = mysqlTable(
  "products",
  {
    id: id(),
    slug: varchar("slug", { length: 191 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    shortDescription: varchar("short_description", { length: 500 }),
    description: text("description"),
    pricePence: int("price_pence").notNull(),
    compareAtPence: int("compare_at_pence"),
    stock: int("stock").notNull().default(0),
    category: varchar("category", { length: 100 }),
    badge: varchar("badge", { length: 50 }),
    labReportUrl: varchar("lab_report_url", { length: 500 }),
    specs: json("specs").$type<ProductSpecs>(),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("products_slug_uq").on(t.slug),
    index("products_active_sort_idx").on(t.isActive, t.sortOrder),
    check("products_price_positive", sql`${t.pricePence} > 0`),
    check("products_stock_nonneg", sql`${t.stock} >= 0`),
  ],
);

export const productImages = mysqlTable(
  "product_images",
  {
    id: id(),
    productId: char("product_id", { length: 36 })
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    url: varchar("url", { length: 500 }).notNull(),
    alt: varchar("alt", { length: 255 }).notNull().default(""),
    sortOrder: int("sort_order").notNull().default(0),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("product_images_product_idx").on(t.productId, t.sortOrder)],
);

// ---------- customers (optional accounts, ADR-005) ----------

export const customers = mysqlTable(
  "customers",
  {
    id: id(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 100 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    defaultAddress: json("default_address").$type<Address>(),
    emailVerifiedAt: datetime("email_verified_at", { mode: "date" }),
    lastLoginAt: datetime("last_login_at", { mode: "date" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("customers_email_uq").on(t.email)],
);

export const customerTokens = mysqlTable(
  "customer_tokens",
  {
    id: id(),
    customerId: char("customer_id", { length: 36 })
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", CUSTOMER_TOKEN_TYPES).notNull(),
    tokenHash: char("token_hash", { length: 64 }).notNull(), // sha256 hex, raw token never stored
    expiresAt: datetime("expires_at", { mode: "date" }).notNull(),
    usedAt: datetime("used_at", { mode: "date" }),
    createdAt: timestamps.createdAt,
  },
  (t) => [
    uniqueIndex("customer_tokens_hash_uq").on(t.tokenHash),
    index("customer_tokens_customer_idx").on(t.customerId),
  ],
);

// ---------- orders ----------

export const orders = mysqlTable(
  "orders",
  {
    id: id(),
    orderNo: varchar("order_no", { length: 16 }).notNull(),
    status: mysqlEnum("status", ORDER_STATUSES).notNull().default("pending_payment"),
    customerId: char("customer_id", { length: 36 }).references(() => customers.id, {
      onDelete: "set null",
    }),
    email: varchar("email", { length: 255 }).notNull(),
    firstName: varchar("first_name", { length: 100 }).notNull(),
    lastName: varchar("last_name", { length: 100 }).notNull(),
    phone: varchar("phone", { length: 40 }),
    addressLine1: varchar("address_line1", { length: 255 }).notNull(),
    addressLine2: varchar("address_line2", { length: 255 }),
    city: varchar("city", { length: 100 }).notNull(),
    postcode: varchar("postcode", { length: 20 }).notNull(),
    country: char("country", { length: 2 }).notNull().default("GB"),
    shippingMethod: varchar("shipping_method", { length: 50 }).notNull(),
    subtotalPence: int("subtotal_pence").notNull(),
    shippingPence: int("shipping_pence").notNull(),
    totalPence: int("total_pence").notNull(),
    paymentMethod: varchar("payment_method", { length: 30 }).notNull().default("bank_transfer"),
    trackingNumber: varchar("tracking_number", { length: 100 }),
    customerNote: text("customer_note"),
    internalNote: text("internal_note"),
    ruoAcceptedAt: datetime("ruo_accepted_at", { mode: "date" }).notNull(),
    ipHash: char("ip_hash", { length: 64 }),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("orders_order_no_uq").on(t.orderNo),
    index("orders_created_idx").on(t.createdAt),
    index("orders_status_idx").on(t.status),
    index("orders_email_idx").on(t.email),
    index("orders_customer_idx").on(t.customerId),
    check("orders_totals_nonneg", sql`${t.subtotalPence} >= 0 AND ${t.shippingPence} >= 0 AND ${t.totalPence} >= 0`),
  ],
);

export const orderItems = mysqlTable(
  "order_items",
  {
    id: id(),
    orderId: char("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    productId: char("product_id", { length: 36 }).references(() => products.id, {
      onDelete: "set null",
    }),
    // Snapshots: the order must read the same even if the product changes later
    productName: varchar("product_name", { length: 255 }).notNull(),
    productSlug: varchar("product_slug", { length: 191 }).notNull(),
    unitPricePence: int("unit_price_pence").notNull(),
    quantity: int("quantity").notNull(),
    lineTotalPence: int("line_total_pence").notNull(),
  },
  (t) => [
    index("order_items_order_idx").on(t.orderId),
    check("order_items_qty_positive", sql`${t.quantity} > 0`),
  ],
);

export const orderEvents = mysqlTable(
  "order_events",
  {
    id: id(),
    orderId: char("order_id", { length: 36 })
      .notNull()
      .references(() => orders.id, { onDelete: "cascade" }),
    type: mysqlEnum("type", ORDER_EVENT_TYPES).notNull(),
    data: json("data").$type<Record<string, unknown>>(),
    actor: varchar("actor", { length: 255 }).notNull().default("system"),
    createdAt: timestamps.createdAt,
  },
  (t) => [index("order_events_order_idx").on(t.orderId, t.createdAt)],
);

// ---------- settings & infra ----------

export const settings = mysqlTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: json("value").notNull(),
  updatedAt: timestamps.updatedAt,
});

/** Fixed-window rate limiting shared across Passenger worker processes. */
export const rateLimits = mysqlTable("rate_limits", {
  key: varchar("key", { length: 191 }).primaryKey(), // e.g. "login:<ipHash>"
  count: int("count").notNull().default(0),
  resetAt: datetime("reset_at", { mode: "date" }).notNull(),
});

// ---------- relations ----------

export const productsRelations = relations(products, ({ many }) => ({
  images: many(productImages),
  orderItems: many(orderItems),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, { fields: [productImages.productId], references: [products.id] }),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  orders: many(orders),
  tokens: many(customerTokens),
}));

export const customerTokensRelations = relations(customerTokens, ({ one }) => ({
  customer: one(customers, { fields: [customerTokens.customerId], references: [customers.id] }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  customer: one(customers, { fields: [orders.customerId], references: [customers.id] }),
  items: many(orderItems),
  events: many(orderEvents),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));

export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
  order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
}));

// ---------- inferred types ----------

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductImage = typeof productImages.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerToken = typeof customerTokens.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderEvent = typeof orderEvents.$inferSelect;
export type Setting = typeof settings.$inferSelect;
