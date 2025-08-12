/*
  Warnings:

  - You are about to drop the column `to_do_id` on the `items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_to_do_id_fkey";

-- AlterTable
ALTER TABLE "public"."items" DROP COLUMN "to_do_id",
ADD COLUMN     "todo_id" UUID;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_todo_id_fkey" FOREIGN KEY ("todo_id") REFERENCES "public"."todos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
