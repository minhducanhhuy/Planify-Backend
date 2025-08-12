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
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/CreateItemDto';
import { get } from 'http';
import { UpdateItemPositionDto } from './dto/UpdateItemPositionDto';

@UseGuards(JwtAuthGuard)
@Controller(
  '/workspaces/:workspaceId/boards/:boardId/lists/:listId/tasks/:idTask/todos/:idTodo/items',
)
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('')
  async createItem(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Body() dto: CreateItemDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.createItem(boardId, todoId, dto, userId);
  }

  @Get(':id')
  async getTodoById(
    @Param('boardId') boardId: string,
    @Param('id') itemId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.getItemById(boardId, itemId, userId);
  }

  @Get(':myItem')
  async getAllTodo(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.getAllItemInTodo(boardId, todoId, userId);
  }

  @Patch(':id/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('id') itemId: string,
    @Body() dto: CreateItemDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.setNameTodo(boardId, itemId, dto, userId);
  }

  @Delete(':id')
  async deleteTodo(
    @Param('boardId') boardId: string,
    @Param('id') itemId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.deleteItem(boardId, itemId, userId);
  }

  @Patch(':id/move')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Param('id') itemId: string,
    @Body() dto: UpdateItemPositionDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.itemsService.updateItemPosition(
      boardId,
      todoId,
      itemId,
      dto,
      userId,
    );
  }
}
