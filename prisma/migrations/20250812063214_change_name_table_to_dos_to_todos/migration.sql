/*
  Warnings:

  - You are about to drop the `to_dos` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."items" DROP CONSTRAINT "items_to_do_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."to_dos" DROP CONSTRAINT "to_dos_task_id_fkey";

-- DropTable
DROP TABLE "public"."to_dos";

-- CreateTable
CREATE TABLE "public"."todos" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "task_id" UUID,
    "title" VARCHAR(255),

    CONSTRAINT "todos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."todos" ADD CONSTRAINT "todos_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "public"."items" ADD CONSTRAINT "items_to_do_id_fkey" FOREIGN KEY ("to_do_id") REFERENCES "public"."todos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
