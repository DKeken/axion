ALTER TABLE "servers" ADD COLUMN "ssh_username" varchar(255);--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "ssh_port" integer DEFAULT 22;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "encrypted_ssh_password" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "encrypted_ssh_private_key" text;--> statement-breakpoint
ALTER TABLE "servers" ADD COLUMN "encrypted_ssh_passphrase" text;