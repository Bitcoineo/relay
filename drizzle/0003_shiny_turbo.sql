ALTER TABLE `message` ADD `pinnedAt` text;--> statement-breakpoint
ALTER TABLE `message` ADD `pinnedById` text REFERENCES user(id);