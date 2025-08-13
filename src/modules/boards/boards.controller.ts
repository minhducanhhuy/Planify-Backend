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
import { AuthUser } from '../../auth/decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('/workspaces/:workspaceId/boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post('')
  async createBoard(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateBoardDto,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.createBoard(dto, user.id, workspaceId);
  }

  @Get('')
  async getAllBoards(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.getAllBoard(user.id, workspaceId);
  }

  @Get(':boardId')
  async getBoardById(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.getBoardById(user.id, workspaceId, boardId);
  }

  @Get('searchName')
  async searchBoardsByName(
    @Param('workspaceId') workspaceId: string,
    @Query('name') name: string,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.searchBoardsByName(user.id, workspaceId, name);
  }

  @Post(':boardId/members')
  async addUsersToBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
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

  @Patch(':boardId/members/role')
  async updateUsersRole(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
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

  @Delete(':boardId')
  async deleteBoard(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.deleteBoard(workspaceId, boardId, user.id);
  }

  @Delete(':boardId/members')
  async kickUsers(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
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

  @Delete(':boardId/members/me')
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @Param('boardId') boardId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.boardsService.leaveBoard(workspaceId, boardId, user.id);
  }

  @Patch(':boardId/name')
  async setNameBoard(
    @Param('boardId') boardId: string,
    @Body() dto: CreateBoardDto,
    @Req() req,
  ) {
    return this.boardsService.setNameBoard(boardId, req.user.id, dto);
  }
}
