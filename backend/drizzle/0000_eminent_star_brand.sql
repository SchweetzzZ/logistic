CREATE TABLE `tenants` (
	`id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`document` varchar(20) NOT NULL,
	`status` enum('ACTIVE','INACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_document_unique` UNIQUE(`document`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`role` enum('ADMIN','MANAGER','OPERATOR') NOT NULL DEFAULT 'OPERATOR',
	`tenant_id` varchar(36) NOT NULL,
	`refresh_token_hash` varchar(255),
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`email` varchar(100),
	`cpf` varchar(14) NOT NULL,
	`phone` varchar(20),
	`zip_code` varchar(9),
	`street` varchar(150),
	`number` varchar(20),
	`complement` varchar(100),
	`city` varchar(100),
	`state` varchar(20),
	`tenant_id` varchar(36) NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_customer_cpf_idx` UNIQUE(`tenant_id`,`cpf`)
);
--> statement-breakpoint
CREATE TABLE `carriers` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`name` varchar(150) NOT NULL,
	`document` varchar(20) NOT NULL,
	`phone` varchar(20),
	`email` varchar(100),
	`base_price` decimal(10,2) NOT NULL DEFAULT '0.00',
	`price_per_kg` decimal(10,2) NOT NULL DEFAULT '0.00',
	`deadline_days` int NOT NULL DEFAULT 3,
	`status` enum('ACTIVE','INACTIVE') NOT NULL DEFAULT 'ACTIVE',
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	`updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `carriers_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_carrier_name_idx` UNIQUE(`tenant_id`,`name`),
	CONSTRAINT `tenant_carrier_document_idx` UNIQUE(`tenant_id`,`document`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `customers` ADD CONSTRAINT `customers_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `carriers` ADD CONSTRAINT `carriers_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;