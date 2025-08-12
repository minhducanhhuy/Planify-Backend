import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTodoDto } from './dto/CreateTodoDto';
import { UpdateTodoPositionDto } from './dto/UpdateTodoPositionDto';

@Injectable()
export class TodosService {
  constructor(private prisma: PrismaService) {}

  async createTodo(
    boardId: string,
    taskId: string,
    dto: CreateTodoDto,
    userId: string,
  ) {
    // Kiểm tra quyền user
    const user = await this.prisma.board_users.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not belong to this workspace');
    }

    if (user.role !== 'editor') {
      throw new ForbiddenException(
        'User does not have enough authority to create a task',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const task = await tx.tasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const maxPosition = await tx.todos.aggregate({
        where: { task_id: taskId },
        _max: { position: true },
      });

      const GAP = 100;
      const nextPosition = (maxPosition._max.position || 0) + GAP;

      return tx.todos.create({
        data: {
          task_id: taskId,
          title: dto.name,
          position: nextPosition,
        },
      });
    });
  }

  async getTodoById(boardId: string, todoId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.todos.findUnique({
      where: {
        id: todoId,
      },
    });
  }

  async getAllTodoInTask(boardId: string, taskId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.todos.findMany({
      where: {
        task_id: taskId,
      },
    });
  }

  async setNameTodo(
    boardId: string,
    todoId: string,
    dto: CreateTodoDto,
    userId: string,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const user = await tx.board_users.findUnique({
        where: {
          board_id_user_id: {
            board_id: boardId,
            user_id: userId,
          },
        },
      });

      if (!user) throw new Error('User not found');

      if (user.role !== 'editor')
        throw new ForbiddenException('Can not edit this board');

      const todo = await tx.todos.findUnique({
        where: { id: todoId },
      });

      if (!todo) {
        throw new Error('Todo not found');
      }

      return tx.todos.update({
        where: {
          id: todoId,
        },
        data: {
          title: dto.name,
        },
      });
    });
  }

  async deleteTodo(boardId: string, todoId: string, userId: string) {
    const user = await this.prisma.board_users.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!user) throw new Error('User not found');

    if (user.role !== 'editor')
      throw new ForbiddenException('Can not edit this board');

    const todo = await this.prisma.todos.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    // Transaction để đảm bảo xóa đồng bộ
    return this.prisma.$transaction(async (tx) => {
      return await tx.todos.delete({
        where: { id: todoId },
      });
    });
  }

  async updateTodoPosition(
    boardId: string,
    taskId: string,
    todoId: string,
    dto: UpdateTodoPositionDto,
    userId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const user = await tx.board_users.findUnique({
        where: {
          board_id_user_id: {
            board_id: boardId,
            user_id: userId,
          },
        },
      });

      if (!user) throw new Error('User not found');

      if (user.role !== 'editor')
        throw new ForbiddenException('Can not edit this board');

      const task = await tx.tasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      const todo = await tx.todos.findUnique({
        where: { id: todoId },
      });

      if (!todo) {
        throw new Error('Todo not found');
      }

      let before;
      let after;

      // Lấy dữ liệu trước & sau trong transaction
      if (dto.beforeId) {
        before = await tx.todos.findFirst({
          where: { id: dto.beforeId },
          select: { position: true },
        });
      }

      if (dto.afterId) {
        after = await tx.todos.findFirst({
          where: { id: dto.afterId },
          select: { position: true },
        });
      }

      // Tính toán vị trí mới
      const GAP = 100;
      let newPosition: number;
      if (before?.position != null && after?.position != null) {
        newPosition = (before.position + after.position) / 2;
      } else if (before?.position != null) {
        newPosition = before.position + GAP;
      } else if (after?.position != null) {
        newPosition = after.position - GAP;
      } else {
        newPosition = GAP;
      }

      // Cập nhật vị trí list
      await tx.todos.update({
        where: { id: todoId },
        data: { position: newPosition },
      });

      // check and re-Index

      let needReindex = false;

      if (before?.position != null && after?.position != null) {
        if (
          Math.abs(before.position - newPosition) < 0.0001 ||
          Math.abs(after.position - newPosition) < 0.0001 ||
          after.position - before.position < 0.0001
        ) {
          needReindex = true;
        }
      }

      if (needReindex) {
        const todos = await tx.todos.findMany({
          where: { task_id: taskId },
          orderBy: { position: 'asc' },
        });

        await Promise.all(
          todos.map((todo, idx) =>
            tx.todos.update({
              where: { id: todo.id },
              data: { position: (idx + 1) * GAP },
            }),
          ),
        );
      }

      return tx.todos.findMany({
        where: { task_id: taskId },
        orderBy: { position: 'asc' },
      });
    });
  }
}
