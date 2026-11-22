CREATE TABLE `customer_tokens` (
	`id` char(36) NOT NULL,
	`customer_id` char(36) NOT NULL,
	`type` enum('reset_password','verify_email') NOT NULL,
	`token_hash` char(64) NOT NULL,
	`expires_at` datetime NOT NULL,
	`used_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customer_tokens_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_tokens_hash_uq` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` char(36) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(100) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(40),
	`default_address` json,
	`email_verified_at` datetime,
	`last_login_at` datetime,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_email_uq` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `order_events` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`type` enum('created','status_changed','email_sent','email_failed','note','customer_linked') NOT NULL,
	`data` json,
	`actor` varchar(255) NOT NULL DEFAULT 'system',
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `order_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `order_items` (
	`id` char(36) NOT NULL,
	`order_id` char(36) NOT NULL,
	`product_id` char(36),
	`product_name` varchar(255) NOT NULL,
	`product_slug` varchar(191) NOT NULL,
	`unit_price_pence` int NOT NULL,
	`quantity` int NOT NULL,
	`line_total_pence` int NOT NULL,
	CONSTRAINT `order_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `order_items_qty_positive` CHECK(`order_items`.`quantity` > 0)
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` char(36) NOT NULL,
	`order_no` varchar(16) NOT NULL,
	`status` enum('pending_payment','paid','processing','shipped','completed','cancelled') NOT NULL DEFAULT 'pending_payment',
	`customer_id` char(36),
	`email` varchar(255) NOT NULL,
	`first_name` varchar(100) NOT NULL,
	`last_name` varchar(100) NOT NULL,
	`phone` varchar(40),
	`address_line1` varchar(255) NOT NULL,
	`address_line2` varchar(255),
	`city` varchar(100) NOT NULL,
	`postcode` varchar(20) NOT NULL,
	`country` char(2) NOT NULL DEFAULT 'GB',
	`shipping_method` varchar(50) NOT NULL,
	`subtotal_pence` int NOT NULL,
	`shipping_pence` int NOT NULL,
	`total_pence` int NOT NULL,
	`payment_method` varchar(30) NOT NULL DEFAULT 'bank_transfer',
	`tracking_number` varchar(100),
	`customer_note` text,
	`internal_note` text,
	`ruo_accepted_at` datetime NOT NULL,
	`ip_hash` char(64),
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `orders_id` PRIMARY KEY(`id`),
	CONSTRAINT `orders_order_no_uq` UNIQUE(`order_no`),
	CONSTRAINT `orders_totals_nonneg` CHECK(`orders`.`subtotal_pence` >= 0 AND `orders`.`shipping_pence` >= 0 AND `orders`.`total_pence` >= 0)
);
--> statement-breakpoint
CREATE TABLE `product_images` (
	`id` char(36) NOT NULL,
	`product_id` char(36) NOT NULL,
	`url` varchar(500) NOT NULL,
	`alt` varchar(255) NOT NULL DEFAULT '',
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `product_images_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` char(36) NOT NULL,
	`slug` varchar(191) NOT NULL,
	`name` varchar(255) NOT NULL,
	`short_description` varchar(500),
	`description` text,
	`price_pence` int NOT NULL,
	`compare_at_pence` int,
	`stock` int NOT NULL DEFAULT 0,
	`category` varchar(100),
	`badge` varchar(50),
	`lab_report_url` varchar(500),
	`specs` json,
	`is_active` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	`created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_slug_uq` UNIQUE(`slug`),
	CONSTRAINT `products_price_positive` CHECK(`products`.`price_pence` > 0),
	CONSTRAINT `products_stock_nonneg` CHECK(`products`.`stock` >= 0)
);
--> statement-breakpoint
CREATE TABLE `rate_limits` (
	`key` varchar(191) NOT NULL,
	`count` int NOT NULL DEFAULT 0,
	`reset_at` datetime NOT NULL,
	CONSTRAINT `rate_limits_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` varchar(64) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `settings_key` PRIMARY KEY(`key`)
);
--> statement-breakpoint
ALTER TABLE `customer_tokens` ADD CONSTRAINT `customer_tokens_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_events` ADD CONSTRAINT `order_events_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_orders_id_fk` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `orders` ADD CONSTRAINT `orders_customer_id_customers_id_fk` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `product_images` ADD CONSTRAINT `product_images_product_id_products_id_fk` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `customer_tokens_customer_idx` ON `customer_tokens` (`customer_id`);--> statement-breakpoint
CREATE INDEX `order_events_order_idx` ON `order_events` (`order_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `order_items_order_idx` ON `order_items` (`order_id`);--> statement-breakpoint
CREATE INDEX `orders_created_idx` ON `orders` (`created_at`);--> statement-breakpoint
CREATE INDEX `orders_status_idx` ON `orders` (`status`);--> statement-breakpoint
CREATE INDEX `orders_email_idx` ON `orders` (`email`);--> statement-breakpoint
CREATE INDEX `orders_customer_idx` ON `orders` (`customer_id`);--> statement-breakpoint
CREATE INDEX `product_images_product_idx` ON `product_images` (`product_id`,`sort_order`);--> statement-breakpoint
CREATE INDEX `products_active_sort_idx` ON `products` (`is_active`,`sort_order`);