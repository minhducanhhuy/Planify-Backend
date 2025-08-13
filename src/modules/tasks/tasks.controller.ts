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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskPositionDto } from './dto/UpdateTaskPositionDto';
import { UpdateDescriptionDto } from './dto/UpdateDescriptionDto';

@UseGuards(JwtAuthGuard)
@Controller('/boards/:boardId/lists/:listId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('')
  async createTask(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.createTask(boardId, listId, dto, user.id);
  }

  @Get('')
  async getAllTasks(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.getAllTaskInList(boardId, listId, user.id);
  }

  @Get(':taskId')
  async getTaskById(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.getTaskById(boardId, taskId, user.id);
  }

  @Patch(':taskId/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTaskDto,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.setNameTask(boardId, taskId, dto, user.id);
  }

  @Patch(':taskId/description')
  async setDescription(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateDescriptionDto,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.setDescriptionTask(boardId, taskId, dto, user.id);
  }

  @Delete(':taskId')
  async deleteTask(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.deleteTask(boardId, taskId, user.id);
  }

  @Patch(':taskId/position')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskPositionDto,
    @AuthUser() user: Express.User,
  ) {
    return this.tasksService.updateListPosition(
      boardId,
      listId,
      taskId,
      dto,
      user.id,
    );
  }
}
