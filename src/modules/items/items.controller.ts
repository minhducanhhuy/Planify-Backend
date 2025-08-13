import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthUser } from '../../auth/decorators/auth-user.decorator';
import { ItemsService } from './items.service';
import { CreateItemDto } from './dto/CreateItemDto';
import { UpdateItemPositionDto } from './dto/UpdateItemPositionDto';

@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/todos/:todoId/items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Post('')
  async createItem(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Body() dto: CreateItemDto,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.createItem(boardId, todoId, dto, user.id);
  }

  @Get('')
  async getAllItems(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.getAllItemInTodo(boardId, todoId, user.id);
  }

  @Get(':itemId')
  async getItemById(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Param('itemId') itemId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.getItemById(boardId, itemId, user.id);
  }

  @Patch(':itemId/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Param('itemId') itemId: string,
    @Body() dto: CreateItemDto,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.setNameItem(boardId, itemId, dto, user.id);
  }

  @Delete(':itemId')
  async deleteItem(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Param('itemId') itemId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.deleteItem(boardId, itemId, user.id);
  }

  @Patch(':itemId/position')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('todoId') todoId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateItemPositionDto,
    @AuthUser() user: Express.User,
  ) {
    return this.itemsService.updateItemPosition(
      boardId,
      todoId,
      itemId,
      dto,
      user.id,
    );
  }
}
