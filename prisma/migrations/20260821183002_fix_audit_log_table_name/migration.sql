-- Rename audit_logs to audit_log to match the Prisma schema @@map("audit_log")
ALTER TABLE "audit_logs" RENAME TO "audit_log";
