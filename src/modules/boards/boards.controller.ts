import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Patch,
  Param,
  Delete,
  UseGuards,
  NotFoundException,
  ParseUUIDPipe,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'; // nếu có
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/CreateBoardDto';
import { AddBoardUsersDto } from './dto/AddBoardUsersDto';
import { UpdateBoardUserRoleDto } from './dto/UpdateBoardUserRoleDto';
import { KickUsersDto } from './dto/KickUsersDto';

@UseGuards(JwtAuthGuard)
@Controller('/workspaces/:workspaceId/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post('')
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBoardDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.createBoard(dto, userId, workspaceId);
  }

  @Get(':id')
  async getBoardById(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    const board = await this.boardsService.getBoardById(
      userId,
      workspaceId,
      boardId,
    );
    if (!board) {
      throw new NotFoundException('Board not found in this workspace');
    }
    return board;
  }

  @Get('myBoard')
  async getAllBoard(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.getAllBoard(userId, workspaceId);
  }

  @Get('search')
  async searchBoardsByName(
    @Param('workspaceId') workspaceId: string,
    @Query('name') name: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.searchBoardsByName(userId, workspaceId, name);
  }

  @Post(':id/add')
  async addUsersToBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Body() dto: AddBoardUsersDto,
    @Req() req,
  ) {
    return this.boardsService.addUsersToBoard(
      workspaceId,
      boardId,
      req.user.id,
      dto,
    );
  }

  @Patch(':id/role')
  async updateUsersRole(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Body() dto: UpdateBoardUserRoleDto,
    @Req() req,
  ) {
    return this.boardsService.updateUsersRole(
      workspaceId,
      boardId,
      req.user.id,
      dto,
    );
  }

  @Delete(':id')
  async deleteBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.deleteBoard(workspaceId, boardId, userId);
  }

  @Delete(':id/kick')
  async kickUsers(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Body() dto: KickUsersDto,
    @Req() req,
  ) {
    return this.boardsService.kickUsersByEmail(
      workspaceId,
      boardId,
      req.user.id,
      dto,
    );
  }

  @Delete(':id/leave')
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Param('id') boardId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.boardsService.leaveBoard(workspaceId, boardId, userId);
  }

  @Patch(':id/name')
  async setNameBoard(
    @Param('id') boardId: string,
    @Body() dto: CreateBoardDto,
    @Req() req,
  ) {
    return this.boardsService.setNameBoard(boardId, req.user.id, dto);
  }
}
