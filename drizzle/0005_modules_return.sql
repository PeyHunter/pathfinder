CREATE TABLE `modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`order` integer NOT NULL,
	`title` text NOT NULL,
	`why_it_matters` text NOT NULL,
	`content_status` text DEFAULT 'none' NOT NULL,
	`content_error` text,
	FOREIGN KEY (`path_id`) REFERENCES `paths`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
-- Existing concepts go into one module per path, so module_id can be NOT NULL. Ready if every lesson is written.
INSERT INTO `modules` (`path_id`, `order`, `title`, `why_it_matters`, `content_status`)
SELECT p.`id`, 1, 'All concepts', '',
	CASE WHEN EXISTS (SELECT 1 FROM `concepts` c WHERE c.`path_id` = p.`id` AND c.`content_json` IS NULL) THEN 'none' ELSE 'ready' END
FROM `paths` p WHERE EXISTS (SELECT 1 FROM `concepts` c WHERE c.`path_id` = p.`id`);
--> statement-breakpoint
CREATE TABLE `__new_concepts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`path_id` integer NOT NULL,
	`module_id` integer NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`summary` text NOT NULL,
	`step` integer NOT NULL,
	`added_by_system` integer NOT NULL,
	`content_json` text,
	`rubric_json` text,
	FOREIGN KEY (`path_id`) REFERENCES `paths`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_concepts`("id", "path_id", "module_id", "slug", "name", "summary", "step", "added_by_system", "content_json", "rubric_json")
SELECT c."id", c."path_id", m."id", c."slug", c."name", c."summary", c."step", c."added_by_system", c."content_json", c."rubric_json"
FROM `concepts` c JOIN `modules` m ON m.`path_id` = c.`path_id`;
--> statement-breakpoint
DROP TABLE `concepts`;--> statement-breakpoint
ALTER TABLE `__new_concepts` RENAME TO `concepts`;--> statement-breakpoint
CREATE UNIQUE INDEX `concepts_path_slug` ON `concepts` (`path_id`,`slug`);--> statement-breakpoint
ALTER TABLE `paths` DROP COLUMN `content_status`;--> statement-breakpoint
ALTER TABLE `paths` DROP COLUMN `content_error`;
