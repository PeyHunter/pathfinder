DROP TABLE `modules`;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`step` integer NOT NULL,
	`added_by_system` integer NOT NULL,
	`content_json` text,
	`rubric_json` text,
	FOREIGN KEY (`path_id`) REFERENCES `paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_concepts`("id", "path_id", "slug", "name", "summary", "step", "added_by_system", "content_json", "rubric_json") SELECT "id", "path_id", "slug", "name", "summary", "step", "added_by_system", "content_json", "rubric_json" FROM `concepts`;--> statement-breakpoint
DROP TABLE `concepts`;--> statement-breakpoint
ALTER TABLE `__new_concepts` RENAME TO `concepts`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `concepts_path_slug` ON `concepts` (`path_id`,`slug`);--> statement-breakpoint
ALTER TABLE `paths` ADD `content_status` text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE `paths` ADD `content_error` text;--> statement-breakpoint
UPDATE `paths` SET `content_status` = 'ready' WHERE EXISTS (SELECT 1 FROM `concepts` c WHERE c.`path_id` = `paths`.`id`) AND NOT EXISTS (SELECT 1 FROM `concepts` c WHERE c.`path_id` = `paths`.`id` AND c.`content_json` IS NULL);
