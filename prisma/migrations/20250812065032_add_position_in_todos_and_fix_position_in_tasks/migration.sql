-- AlterTable
ALTER TABLE "public"."tasks" ALTER COLUMN "position" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "public"."todos" ADD COLUMN     "position" DOUBLE PRECISION;
