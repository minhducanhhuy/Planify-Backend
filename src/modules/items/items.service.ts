import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/CreateItemDto';
import { UpdateItemPositionDto } from './dto/UpdateItemPositionDto';

@Injectable()
export class ItemsService {
  constructor(private prisma: PrismaService) {}

  async createItem(
    boardId: string,
    todoId: string,
    dto: CreateItemDto,
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
      const todo = await tx.todos.findUnique({
        where: { id: todoId },
      });

      if (!todo) {
        throw new Error('Todo not found');
      }

      const maxPosition = await tx.items.aggregate({
        where: { todo_id: todoId },
        _max: { position: true },
      });

      const GAP = 100;
      const nextPosition = (maxPosition._max.position || 0) + GAP;

      return tx.items.create({
        data: {
          todo_id: todoId,
          content: dto.name,
          position: nextPosition,
        },
      });
    });
  }

  async getItemById(boardId: string, itemId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.items.findUnique({
      where: {
        id: itemId,
      },
    });
  }

  async getAllItemInTodo(boardId: string, todoId: string, userId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.items.findMany({
      where: {
        todo_id: todoId,
      },
    });
  }

  async setNameTodo(
    boardId: string,
    itemId: string,
    dto: CreateItemDto,
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

      const item = await tx.items.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      return tx.items.update({
        where: {
          id: itemId,
        },
        data: {
          content: dto.name,
        },
      });
    });
  }

  async deleteItem(boardId: string, itemId: string, userId: string) {
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

    const item = await this.prisma.items.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new Error('Todo not found');
    }

    // Transaction để đảm bảo xóa đồng bộ
    return this.prisma.$transaction(async (tx) => {
      return await tx.items.delete({
        where: { id: itemId },
      });
    });
  }

  async updateItemPosition(
    boardId: string,
    todoId: string,
    itemId: string,
    dto: UpdateItemPositionDto,
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

      const todo = await tx.todos.findUnique({
        where: { id: todoId },
      });

      if (!todo) {
        throw new Error('Todo not found');
      }

      const item = await tx.items.findUnique({
        where: { id: itemId },
      });

      if (!item) {
        throw new Error('Item not found');
      }

      let before;
      let after;

      // Lấy dữ liệu trước & sau trong transaction
      if (dto.beforeId) {
        before = await tx.items.findFirst({
          where: { id: dto.beforeId },
          select: { position: true },
        });
      }

      if (dto.afterId) {
        after = await tx.items.findFirst({
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
      await tx.items.update({
        where: { id: itemId },
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
        const items = await tx.items.findMany({
          where: { todo_id: todoId },
          orderBy: { position: 'asc' },
        });

        await Promise.all(
          items.map((it, idx) =>
            tx.items.update({
              where: { id: it.id },
              data: { position: (idx + 1) * GAP },
            }),
          ),
        );
      }

      return tx.items.findMany({
        where: { todo_id: todoId },
        orderBy: { position: 'asc' },
      });
    });
  }
}
