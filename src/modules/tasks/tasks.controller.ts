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
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskPositionDto } from './dto/UpdateTaskPositionDto';

@UseGuards(JwtAuthGuard)
@Controller('/workspaces/:workspaceId/boards/:boardId/lists/:listId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post('')
  async createTask(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.createTask(boardId, listId, dto, userId);
  }

  @Get(':id')
  async getTaskById(
    @Param('boardId') boardId: string,
    @Param('id') taskId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.getTaskById(boardId, taskId, userId);
  }

  @Get('mytask')
  async getAllTask(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.getAllTaskInList(boardId, listId, userId);
  }

  @Patch(':id/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('id') taskId: string,
    @Body() dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.setNameTask(boardId, taskId, dto, userId);
  }

  @Delete(':id')
  async deleteList(
    @Param('boardId') boardId: string,
    @Param('id') taskId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.deleteTask(boardId, taskId, userId);
  }

  @Patch(':id/move')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('id') taskId: string,
    @Body() dto: UpdateTaskPositionDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.tasksService.updateListPosition(
      boardId,
      listId,
      taskId,
      dto,
      userId,
    );
  }
}
