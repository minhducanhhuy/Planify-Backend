import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { BoardsService } from './boards.service';

@UseGuards(JwtAuthGuard)
@Controller('/boards')
export class UserBoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get('search')
  async searchAllBoardsByUser(
    @Query('name') name: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.searchBoardsByUserAcrossAllWorkspaces(
      userId,
      name,
    );
  }

  @Get('myBoards')
  async getAllBoard(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.getAllBoardAcrossAllWorkspaces(userId);
  }
}
