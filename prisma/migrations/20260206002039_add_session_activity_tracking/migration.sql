-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "ipAddress" TEXT;
ALTER TABLE "sessions" ADD COLUMN "loggedOutAt" DATETIME;
ALTER TABLE "sessions" ADD COLUMN "userAgent" TEXT;
