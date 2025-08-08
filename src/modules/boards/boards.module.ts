import { Module } from '@nestjs/common';
import { BoardsController } from './boards.controller';
import { UserBoardsController } from './user-boards.controller';
import { BoardsService } from './boards.service';

@Module({
  controllers: [BoardsController, UserBoardsController],
  providers: [BoardsService],
})
export class BoardsModule {}
