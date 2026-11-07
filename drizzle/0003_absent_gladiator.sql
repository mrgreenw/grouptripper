CREATE TABLE `grouptripper_password_resets` (
	`account_id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`expires` integer NOT NULL,
	`created` integer NOT NULL,
	FOREIGN KEY (`account_id`) REFERENCES `grouptripper_accounts`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grouptripper_password_resets_token_hash_unique` ON `grouptripper_password_resets` (`token_hash`);