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
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/CreateTodoDto';
import { UpdateTodoPositionDto } from './dto/UpdateTodoPositionDto';

@UseGuards(JwtAuthGuard)
@Controller(
  '/workspaces/:workspaceId/boards/:boardId/lists/:listId/tasks/:idTask/todos',
)
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post('')
  async createTodo(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTodoDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.createTodo(boardId, taskId, dto, userId);
  }

  @Get(':id')
  async getTodoById(
    @Param('boardId') boardId: string,
    @Param('id') todoId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.getTodoById(boardId, todoId, userId);
  }

  @Get('mytodo')
  async getAllTodo(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.getAllTodoInTask(boardId, taskId, userId);
  }

  @Patch(':id/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('id') todoId: string,
    @Body() dto: CreateTodoDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.setNameTodo(boardId, todoId, dto, userId);
  }

  @Delete(':id')
  async deleteTodo(
    @Param('boardId') boardId: string,
    @Param('id') todoId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.deleteTodo(boardId, todoId, userId);
  }

  @Patch(':id/move')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('taskId') taskId: string,
    @Param('id') todoId: string,
    @Body() dto: UpdateTodoPositionDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }

    const userId = req.user.id;
    return this.todosService.updateTodoPosition(
      boardId,
      taskId,
      todoId,
      dto,
      userId,
    );
  }
}
