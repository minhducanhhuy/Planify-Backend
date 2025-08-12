import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CreateListDto } from './dto/CreateListDto';
import { UpdateListPositionDto } from './dto/UpdateListPositionDto';

@Injectable()
export class ListsService {
  constructor(private prisma: PrismaService) {}

  async createList(dto: CreateListDto, userId: string, boardId: string) {
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
        'User does not have enough authority to create a list',
      );
    }

    // Transaction để đảm bảo position không trùng
    return this.prisma.$transaction(async (tx) => {
      const maxPosition = await tx.lists.aggregate({
        where: { board_id: boardId },
        _max: { position: true },
      });

      const GAP = 100;
      const nextPosition = (maxPosition._max.position || 0) + GAP;

      return tx.lists.create({
        data: {
          name: dto.name,
          board_id: boardId,
          position: nextPosition,
        },
      });
    });
  }

  async getListById(userId: string, boardId: string, listId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.lists.findUnique({
      where: {
        board_id: boardId,
        id: listId,
      },
    });
  }

  async getAllList(userId: string, boardId: string) {
    const canAccess = await this.prisma.board_users.findFirst({
      where: { user_id: userId, board_id: boardId },
    });
    if (!canAccess)
      throw new UnauthorizedException('this user can not access to this board');

    return this.prisma.lists.findMany({
      where: { board_id: boardId },
    });
  }

  async deleteList(listId: string, boardId: string, userId: string) {
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

    const list = await this.prisma.lists.findUnique({
      where: { id: listId },
    });

    if (!list) {
      throw new Error('List not found');
    }

    // Transaction để đảm bảo xóa đồng bộ
    return this.prisma.$transaction(async (tx) => {
      return await tx.lists.delete({
        where: { id: listId },
      });
    });
  }

  async setNameList(
    listId: string,
    boardId: string,
    userId: string,
    dto: CreateListDto,
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

      const list = await tx.lists.findUnique({
        where: { id: listId },
      });

      if (!list) {
        throw new Error('List not found');
      }

      return tx.lists.update({
        where: {
          id: boardId,
        },
        data: {
          name: dto.name,
        },
      });
    });
  }

  // lists.service.ts
  async updateListPosition(
    listId: string,
    boardId,
    userId,
    dto: UpdateListPositionDto,
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

      const list = await tx.lists.findUnique({
        where: { id: listId },
      });

      if (!list) {
        throw new Error('List not found');
      }

      let before;
      let after;

      // Lấy dữ liệu trước & sau trong transaction
      if (dto.beforeId) {
        before = await tx.lists.findUnique({
          where: { id: dto.beforeId },
          select: { position: true },
        });
      }

      if (dto.afterId) {
        after = await tx.lists.findUnique({
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
        throw new Error('Invalid position data');
      }

      // Cập nhật vị trí list
      await tx.lists.update({
        where: { id: listId },
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
        const lists = await tx.lists.findMany({
          where: { board_id: boardId },
          orderBy: { position: 'asc' },
        });

        for (let i = 0; i < lists.length; i++) {
          await tx.lists.update({
            where: { id: lists[i].id },
            data: { position: (i + 1) * GAP },
          });
        }
      }

      return tx.lists.findMany({
        where: { board_id: boardId },
        orderBy: { position: 'asc' },
      });
    });
  }
}
