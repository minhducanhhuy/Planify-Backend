import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMoudle } from './auth/auth.module';
import { PrismaModule } from 'src/modules/prisma/prisma.module';
import { WorkspacesModule } from './modules/workspaces/workspaces.module';
import { BoardsModule } from './modules/boards/boards.module';
import { ListsModule } from './lists/lists.module';

@Module({
  imports: [AuthMoudle, PrismaModule, WorkspacesModule, BoardsModule, ListsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
