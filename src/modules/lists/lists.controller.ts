import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/CreateListDto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateListPositionDto } from './dto/UpdateListPositionDto';

@UseGuards(JwtAuthGuard)
@Controller('/workspaces/:workspaceId/boards/:boardId/lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post('')
  async createList(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.createList(dto, userId, boardId);
  }

  @Get(':id')
  async getListById(
    @Param('boardId') boardId: string,
    @Param('id') listId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.getListById(userId, boardId, listId);
  }

  @Get('myList')
  async getAllList(@Param('boardId') boardId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.getAllList(userId, boardId);
  }

  @Delete(':id')
  async deleteList(
    @Param('id') listId: string,
    @Param('boardId') boardId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.deleteList(listId, boardId, userId);
  }

  @Patch(':id/name')
  async setName(
    @Param('id') listId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.setNameList(listId, boardId, userId, dto);
  }

  @Patch(':id/move')
  async updatePosition(
    @Param('id') listId: string,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateListPositionDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.listsService.updateListPosition(listId, boardId, userId, dto);
  }
}
