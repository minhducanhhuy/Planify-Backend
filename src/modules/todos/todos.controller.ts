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
import { TodosService } from './todos.service';
import { CreateTodoDto } from './dto/CreateTodoDto';
import { UpdateTodoPositionDto } from './dto/UpdateTodoPositionDto';

@UseGuards(JwtAuthGuard)
@Controller('/boards/:boardId/lists/:listId/tasks/:taskId/todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post('')
  async createTodo(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Body() dto: CreateTodoDto,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.createTodo(boardId, taskId, dto, user.id);
  }

  @Get('')
  async getAllTodos(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.getAllTodoInTask(boardId, taskId, user.id);
  }

  @Get(':todoId')
  async getTodoById(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Param('todoId') todoId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.getTodoById(boardId, todoId, user.id);
  }

  @Patch(':todoId/name')
  async setName(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Param('todoId') todoId: string,
    @Body() dto: CreateTodoDto,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.setNameTodo(boardId, todoId, dto, user.id);
  }

  @Delete(':todoId')
  async deleteTodo(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Param('todoId') todoId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.deleteTodo(boardId, todoId, user.id);
  }

  @Patch(':todoId/move')
  async updatePosition(
    @Param('boardId') boardId: string,
    @Param('listId') listId: string,
    @Param('taskId') taskId: string,
    @Param('todoId') todoId: string,
    @Body() dto: UpdateTodoPositionDto,
    @AuthUser() user: Express.User,
  ) {
    return this.todosService.updateTodoPosition(
      boardId,
      taskId,
      todoId,
      dto,
      user.id,
    );
  }
}
