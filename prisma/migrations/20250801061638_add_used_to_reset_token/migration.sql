-- AlterTable
ALTER TABLE "public"."password_reset_tokens" ADD COLUMN     "used" BOOLEAN NOT NULL DEFAULT false;
