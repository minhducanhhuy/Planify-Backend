import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthMoudle } from './auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrismaModule } from 'prisma/prisma.module';

@Module({
  imports: [AuthMoudle, UsersModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
