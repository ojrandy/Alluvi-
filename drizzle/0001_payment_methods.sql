ALTER TABLE `order_events` MODIFY COLUMN `type` enum('created','status_changed','email_sent','email_failed','note','customer_linked','payment_instructions_sent','payment_reminder_sent','customer_reported_paid') NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_method_label` varchar(80);--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_instructions` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_instructions_sent_at` datetime;--> statement-breakpoint
ALTER TABLE `orders` ADD `payment_reminder_sent_at` datetime;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_reported_paid_at` datetime;--> statement-breakpoint
ALTER TABLE `orders` ADD `customer_payment_ref` varchar(120);--> statement-breakpoint
UPDATE `orders` SET `payment_method_label` = 'UK bank transfer' WHERE `payment_method` = 'bank_transfer' AND `payment_method_label` IS NULL;--> statement-breakpoint
DELETE FROM `settings` WHERE `key` = 'bank_details';
