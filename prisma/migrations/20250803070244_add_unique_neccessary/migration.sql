/*
  Warnings:

  - A unique constraint covering the columns `[board_id,user_id]` on the table `board_user_settings` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[board_id,user_id]` on the table `board_users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[board_id,user_id]` on the table `recent_boards` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[board_id,user_id]` on the table `star_boards` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id]` on the table `user_settings` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "board_user_settings_board_id_user_id_key" ON "public"."board_user_settings"("board_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "board_users_board_id_user_id_key" ON "public"."board_users"("board_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "recent_boards_board_id_user_id_key" ON "public"."recent_boards"("board_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "star_boards_board_id_user_id_key" ON "public"."star_boards"("board_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "public"."user_settings"("user_id");
