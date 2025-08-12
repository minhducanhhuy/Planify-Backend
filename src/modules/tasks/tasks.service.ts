import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/CreateTaskDto';
import { UpdateTaskPositionDto } from './dto/UpdateTaskPositionDto';

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  async createTask(
    boardId: string,
    listId: string,
    dto: CreateTaskDto,
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
      const maxPosition = await tx.tasks.aggregate({
        where: { list_id: listId },
        _max: { position: true },
      });

      const GAP = 100;
      const nextPosition = (maxPosition._max.position || 0) + GAP;

      return tx.tasks.create({
        data: {
          list_id: listId,
          board_id: boardId,
          title: dto.name,
          position: nextPosition,
          created_by: userId,
        },
      });
    });
  }

  async getTaskById(boardId: string, taskId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.tasks.findUnique({
      where: {
        id: taskId,
      },
    });
  }

  async getAllTaskInList(boardId: string, listId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.tasks.findMany({
      where: {
        list_id: listId,
      },
    });
  }

  async setNameTask(
    boardId: string,
    taskId: string,
    dto: CreateTaskDto,
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

      const task = await tx.tasks.findUnique({
        where: { id: taskId },
      });

      if (!task) {
        throw new Error('Task not found');
      }

      return tx.tasks.update({
        where: {
          id: taskId,
        },
        data: {
          title: dto.name,
        },
      });
    });
  }

  async deleteTask(boardId: string, taskId: string, userId: string) {
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

    const task = await this.prisma.tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    // Transaction để đảm bảo xóa đồng bộ
    return this.prisma.$transaction(async (tx) => {
      return await tx.tasks.delete({
        where: { id: taskId },
      });
    });
  }

  async updateListPosition(
    boardId,
    listId,
    taskId: string,
    dto: UpdateTaskPositionDto,
    userId,
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

      const list = await tx.lists.findUnique({
        where: { id: listId },
      });

      if (!list) {
        throw new Error('List not found');
      }

      const targetListId = dto.targetListId ?? listId;

      const targetlist = await tx.lists.findUnique({
        where: { id: targetListId },
      });

      if (!targetlist) {
        throw new Error('List not found');
      }

      let before;
      let after;

      // Lấy dữ liệu trước & sau trong transaction
      if (dto.beforeId) {
        before = await tx.tasks.findFirst({
          where: { id: dto.beforeId, list_id: targetListId },
          select: { position: true },
        });
      }

      if (dto.afterId) {
        after = await tx.tasks.findFirst({
          where: { id: dto.afterId, list_id: targetListId },
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
      await tx.tasks.update({
        where: { id: taskId },
        data: { position: newPosition, list_id: targetListId },
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
        const tasks = await tx.tasks.findMany({
          where: { list_id: targetListId },
          orderBy: { position: 'asc' },
        });

        for (let i = 0; i < tasks.length; i++) {
          await tx.tasks.update({
            where: { id: tasks[i].id },
            data: { position: (i + 1) * GAP },
          });
        }
      }

      return tx.tasks.findMany({
        where: { list_id: targetListId },
        orderBy: { position: 'asc' },
      });
    });
  }
}
