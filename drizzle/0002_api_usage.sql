CREATE TABLE `api_usage` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`model` text NOT NULL,
	`input_tokens` integer NOT NULL,
	`output_tokens` integer NOT NULL,
	`cache_write_tokens` integer DEFAULT 0 NOT NULL,
	`cache_read_tokens` integer DEFAULT 0 NOT NULL,
	`cost_usd` real NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
