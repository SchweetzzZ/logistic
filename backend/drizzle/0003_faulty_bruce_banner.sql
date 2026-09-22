ALTER TABLE `users` MODIFY COLUMN `password_hash` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `auth_provider` varchar(30) DEFAULT 'LOCAL' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `provider_id` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `two_factor_secret` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `is_two_factor_enabled` boolean DEFAULT false NOT NULL;