-- AlterTable: add optional password_hash column to users
-- Nullable so existing seed accounts remain valid;
-- production accounts must have a hash set before password login is enabled.
ALTER TABLE "users" ADD COLUMN "password_hash" TEXT;
