CREATE TABLE `grouptripper_memberships` (
	`member` text NOT NULL,
	`trip` text NOT NULL,
	`role` text NOT NULL,
	PRIMARY KEY(`member`, `trip`)
);
--> statement-breakpoint
CREATE TABLE `shirt_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`trip_id` text NOT NULL,
	`member_id` text NOT NULL,
	`author` text NOT NULL,
	`input` text NOT NULL,
	`status` text NOT NULL,
	`lease` text,
	`lease_until` integer,
	`error` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
CREATE INDEX `shirt_member_date` ON `shirt_jobs` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `shirt_date` ON `shirt_jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX `shirt_trip` ON `shirt_jobs` (`trip_id`);--> statement-breakpoint
CREATE TABLE `shirt_worker` (
	`id` text PRIMARY KEY NOT NULL,
	`state` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `grouptripper_spaces` (
	`id` text PRIMARY KEY NOT NULL,
	`code` text NOT NULL,
	`created` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grouptripper_spaces_code_unique` ON `grouptripper_spaces` (`code`);--> statement-breakpoint
ALTER TABLE `grouptripper_sessions` ADD `trip` text;