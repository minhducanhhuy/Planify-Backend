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
import { ListsService } from './lists.service';
import { CreateListDto } from './dto/CreateListDto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AuthUser } from '../../auth/decorators/auth-user.decorator';
import { UpdateListPositionDto } from './dto/UpdateListPositionDto';

@UseGuards(JwtAuthGuard)
@Controller('/boards/:boardId/lists')
export class ListsController {
  constructor(private readonly listsService: ListsService) {}

  @Post('')
  async createList(
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.createList(dto, user.id, boardId);
  }

  @Get('')
  async getAllLists(
    @Param('boardId') boardId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.getAllLists(user.id, boardId);
  }

  @Get(':listId')
  async getListById(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.getListById(user.id, boardId, listId);
  }

  @Delete(':listId')
  async deleteList(
    @Param('listId') listId: string,
    @Param('boardId') boardId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.deleteList(listId, boardId, user.id);
  }

  @Patch(':listId/name')
  async setName(
    @Param('listId') listId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateListDto,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.setNameList(listId, boardId, user.id, dto);
  }

  @Patch(':listId/position')
  async updatePosition(
    @Param('listId') listId: string,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateListPositionDto,
    @AuthUser() user: Express.User,
  ) {
    return this.listsService.updateListPosition(listId, boardId, user.id, dto);
  }
}
