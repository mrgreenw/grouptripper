CREATE TABLE `grouptripper_controls` (
	`id` text PRIMARY KEY NOT NULL,
	`revision` integer DEFAULT 0 NOT NULL,
	`tripsPaused` integer DEFAULT 0 NOT NULL,
	`accountsPaused` integer DEFAULT 0 NOT NULL,
	`shirtsPaused` integer DEFAULT 0 NOT NULL,
	`tripsDaily` integer DEFAULT 10 NOT NULL,
	`accountsDaily` integer DEFAULT 100 NOT NULL,
	`tripsTotal` integer DEFAULT 100 NOT NULL,
	`accountsTotal` integer DEFAULT 1000 NOT NULL,
	`designsTotal` integer DEFAULT 500 NOT NULL
);
--> statement-breakpoint
ALTER TABLE `grouptripper_accounts` ADD `created` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `account_created` ON `grouptripper_accounts` (`created`);--> statement-breakpoint
ALTER TABLE `grouptripper_spaces` ADD `invites_paused` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `grouptripper_spaces` ADD `invite_revision` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX `space_created` ON `grouptripper_spaces` (`created`);
--> statement-breakpoint
INSERT INTO grouptripper_controls (id) VALUES ('demo');
--> statement-breakpoint
CREATE TRIGGER demo_account_cap BEFORE INSERT ON grouptripper_accounts BEGIN
 SELECT CASE WHEN COALESCE((SELECT accountsPaused=0 AND (SELECT COUNT(*) FROM grouptripper_accounts)<accountsTotal AND (SELECT COUNT(*) FROM grouptripper_accounts WHERE created>unixepoch()*1000-86400000)<accountsDaily FROM grouptripper_controls WHERE id='demo'),0)=0 THEN RAISE(ABORT,'demo_accounts_limit') END;
END;
--> statement-breakpoint
CREATE TRIGGER demo_trip_cap BEFORE INSERT ON grouptripper_spaces BEGIN
 SELECT CASE WHEN COALESCE((SELECT tripsPaused=0 AND (SELECT COUNT(*) FROM grouptripper_spaces)<tripsTotal AND (SELECT COUNT(*) FROM grouptripper_spaces WHERE created>unixepoch()*1000-86400000)<tripsDaily FROM grouptripper_controls WHERE id='demo'),0)=0 THEN RAISE(ABORT,'demo_trips_limit') END;
END;
--> statement-breakpoint
CREATE TRIGGER demo_membership_cap BEFORE INSERT ON grouptripper_memberships BEGIN
 SELECT CASE WHEN (SELECT COUNT(*) FROM grouptripper_memberships WHERE member=NEW.member)>=5 OR (SELECT COUNT(*) FROM grouptripper_memberships WHERE trip=NEW.trip)>=50 THEN RAISE(ABORT,'demo_memberships_limit') END;
END;
--> statement-breakpoint
CREATE TRIGGER demo_shirt_storage_cap BEFORE INSERT ON shirt_jobs BEGIN
 SELECT CASE WHEN COALESCE((SELECT shirtsPaused=0 AND (SELECT COUNT(*) FROM shirt_jobs)<designsTotal FROM grouptripper_controls WHERE id='demo'),0)=0 THEN RAISE(ABORT,'demo_shirts_limit') END;
END;
