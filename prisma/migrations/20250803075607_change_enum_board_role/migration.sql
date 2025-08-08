/*
  Warnings:

  - The values [admin] on the enum `BoardRole` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."BoardRole_new" AS ENUM ('editor', 'commenter', 'viewer');
ALTER TABLE "public"."board_users" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "public"."board_users" ALTER COLUMN "role" TYPE "public"."BoardRole_new" USING ("role"::text::"public"."BoardRole_new");
ALTER TYPE "public"."BoardRole" RENAME TO "BoardRole_old";
ALTER TYPE "public"."BoardRole_new" RENAME TO "BoardRole";
DROP TYPE "public"."BoardRole_old";
ALTER TABLE "public"."board_users" ALTER COLUMN "role" SET DEFAULT 'viewer';
COMMIT;
