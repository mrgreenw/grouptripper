CREATE TABLE `grouptripper_accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grouptripper_accounts_username_unique` ON `grouptripper_accounts` (`username`);--> statement-breakpoint
CREATE TABLE `grouptripper_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grouptripper_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`member` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grouptripper_trip` (
	`id` text PRIMARY KEY NOT NULL,
	`data` text NOT NULL,
	`revision` integer NOT NULL
);
