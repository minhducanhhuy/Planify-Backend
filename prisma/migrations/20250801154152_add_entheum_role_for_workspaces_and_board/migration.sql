/*
  Warnings:

  - The `role` column on the `board_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `workspace_users` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "public"."WorkspaceRole" AS ENUM ('owner', 'admin', 'member');

-- CreateEnum
CREATE TYPE "public"."BoardRole" AS ENUM ('admin', 'editor', 'viewer');

-- AlterTable
ALTER TABLE "public"."board_users" DROP COLUMN "role",
ADD COLUMN     "role" "public"."BoardRole" NOT NULL DEFAULT 'viewer';

-- AlterTable
ALTER TABLE "public"."workspace_users" DROP COLUMN "role",
ADD COLUMN     "role" "public"."WorkspaceRole" NOT NULL DEFAULT 'member';
