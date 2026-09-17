CREATE TABLE `audit_freight` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36) NOT NULL,
	`user_id` varchar(36),
	`origin_zip_code` varchar(8) NOT NULL,
	`destination_zip_code` varchar(8) NOT NULL,
	`origin_city` varchar(100),
	`origin_state` varchar(2),
	`destination_city` varchar(100),
	`destination_state` varchar(2),
	`actual_weight_kg` decimal(10,3) NOT NULL,
	`volumetric_weight_kg` decimal(10,3) NOT NULL,
	`charged_weight_kg` decimal(10,3) NOT NULL,
	`declared_value` decimal(10,2) NOT NULL,
	`dimensions_length` decimal(10,2) NOT NULL,
	`dimensions_width` decimal(10,2) NOT NULL,
	`dimensions_height` decimal(10,2) NOT NULL,
	`delivery_type` enum('LOCAL','STATE','INTERSTATE') NOT NULL,
	`cheapest_carrier_id` varchar(36),
	`cheapest_carrier_name` varchar(150),
	`cheapest_price` decimal(10,2),
	`cheapest_deadline_days` int,
	`quotes` json NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_freight_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` varchar(36) NOT NULL,
	`tenant_id` varchar(36),
	`user_id` varchar(36),
	`action` enum('AUTH_LOGIN','AUTH_LOGOUT','AUTH_LOGIN_FAILED','USER_CREATE','USER_UPDATE','USER_ROLE_CHANGE','USER_DELETE','CARRIER_CREATE','CARRIER_UPDATE','CARRIER_DELETE','CUSTOMER_CREATE','CUSTOMER_UPDATE','CUSTOMER_DELETE') NOT NULL,
	`resource` varchar(50) NOT NULL,
	`resource_id` varchar(36),
	`ip_address` varchar(45),
	`user_agent` varchar(255),
	`details` json,
	`created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `audit_freight` ADD CONSTRAINT `audit_freight_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_freight` ADD CONSTRAINT `audit_freight_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_tenant_id_tenants_id_fk` FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;