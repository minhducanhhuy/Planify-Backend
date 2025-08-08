/*
  Warnings:

  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."items" ADD COLUMN     "position" INTEGER;

-- AlterTable
ALTER TABLE "public"."tasks" DROP COLUMN "priority",
ADD COLUMN     "position" INTEGER;
