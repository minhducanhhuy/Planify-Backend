import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/CreateBoardDto';
import { BoardRole } from '@prisma/client';
import { AddBoardUsersDto } from './dto/AddBoardUsersDto';
import { UpdateBoardUserRoleDto } from './dto/UpdateBoardUserRoleDto';

@Injectable()
export class BoardsService {
  constructor(private prisma: PrismaService) {}

  // @Controller('/workspaces/:workspaceId/boards')
  async createBoard(
    dto: CreateBoardDto,
    creatorId: string,
    workspaceId: string,
  ) {
    const user = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: creatorId,
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not belong to this workspace');
    }

    if (user.role !== 'owner' && user.role !== 'admin')
      throw new ForbiddenException(
        'User do not have enough authority to create a board',
      );

    const workspaceUsers = await this.prisma.workspace_users.findMany({
      where: {
        workspace_id: workspaceId,
        role: {
          in: ['owner', 'admin'],
        },
      },
      select: {
        user_id: true,
      },
    });

    // Lọc bỏ user_id null (nếu có)
    const boardUserCreates = workspaceUsers
      .filter((u) => u.user_id !== null)
      .map((u) => ({
        user_id: u.user_id!,
        role: BoardRole.editor,
      }));

    // Thêm creator nếu chưa có
    if (!boardUserCreates.some((u) => u.user_id === creatorId)) {
      boardUserCreates.push({
        user_id: creatorId,
        role: BoardRole.editor,
      });
    }

    // Tạo board + add các user vào board_users
    return this.prisma.boards.create({
      data: {
        name: dto.name,
        workspace_id: workspaceId,
        created_by: creatorId,
        board_users: {
          createMany: {
            data: boardUserCreates,
          },
        },
      },
    });
  }

  async getBoardById(userId: string, workspaceId: string, boardId: string) {
    const user = await this.prisma.board_users.findUnique({
      where: {
        board_id_user_id: {
          board_id: boardId,
          user_id: userId,
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not belong to this board');
    }

    return this.prisma.boards.findFirst({
      where: {
        id: boardId,
        workspace_id: workspaceId,
      },
    });
  }

  async getAllBoard(userId: string, workspaceId: string) {
    return this.prisma.boards.findMany({
      where: {
        board_users: {
          some: {
            user_id: userId,
          },
        },
        workspace_id: workspaceId,
      },
    });
  }

  async searchBoardsByName(userId: string, workspaceId: string, name: string) {
    const user = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          user_id: userId,
          workspace_id: workspaceId,
        },
      },
    });

    if (!user) {
      throw new Error('Người dùng không tồn tại trong workspace.');
    }

    if (user.role === 'member') {
      throw new Error('Bạn không có quyền thêm người khác.');
    }

    return this.prisma.boards.findMany({
      where: {
        board_users: {
          some: {
            user_id: userId,
          },
        },
        workspace_id: workspaceId,
        name: {
          contains: name,
          mode: 'insensitive', // Không phân biệt hoa thường
        },
      },
      orderBy: {
        name: 'asc', // có thể thêm sort mặc định ở đây
      },
    });
  }

  async addUsersToBoard(
    workspaceId: string,
    boardId: string,
    currentUserId: string,
    dto: AddBoardUsersDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await this.prisma.workspace_users.findUnique({
        where: {
          workspace_id_user_id: {
            user_id: currentUserId,
            workspace_id: workspaceId,
          },
        },
      });

      if (!current) {
        throw new Error('Người dùng không tồn tại trong workspace.');
      }

      if (current.role === 'member') {
        throw new Error('Bạn không có quyền thêm người khác.');
      }

      const workspace = await tx.workspaces.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) throw new NotFoundException('Workspace not found');

      const board = await tx.boards.findUnique({
        where: { id: boardId },
      });

      if (!board) throw new NotFoundException('Board not found');

      const addedUsers: { email: string; role: BoardRole }[] = [];
      for (const userData of dto.users) {
        const user = await tx.users.findUnique({
          where: { email: userData.email },
        });
        if (!user) continue;

        try {
          const newBoardUser = await tx.board_users.upsert({
            where: {
              board_id_user_id: {
                board_id: boardId,
                user_id: user.id,
              },
            },
            update: {
              role: userData.role ?? 'viewer',
            },
            create: {
              board_id: boardId,
              user_id: user.id,
              role: userData.role ?? 'viewer',
            },
          });

          addedUsers.push({
            email: user.email,
            role: newBoardUser.role,
          });
        } catch (err) {
          // Bỏ qua lỗi user đã tồn tại, hoặc có thể throw nếu muốn rollback toàn bộ
          // throw err;
        }
      }
      return {
        message: `Added ${addedUsers.length} users to board`,
        users: addedUsers,
      };
    });
  }

  async updateUsersRole(
    workspaceId: string,
    boardId: string,
    currentUserId: string,
    dto: UpdateBoardUserRoleDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await this.prisma.workspace_users.findUnique({
        where: {
          workspace_id_user_id: {
            user_id: currentUserId,
            workspace_id: workspaceId,
          },
        },
      });

      if (!current) {
        throw new Error('Người cập nhật không tồn tại trong workspace.');
      }

      if (current.role === 'member') {
        throw new Error('Bạn không có quyền thay đổi vai trò người khác.');
      }

      const updatedUsers: { email: string; newRole: BoardRole }[] = [];
      for (const user of dto.users) {
        const userRecord = await tx.users.findUnique({
          where: { email: user.email },
        });

        if (!userRecord) continue;

        const targetInWorkspace = await tx.workspace_users.findUnique({
          where: {
            workspace_id_user_id: {
              user_id: userRecord.id,
              workspace_id: workspaceId,
            },
          },
        });

        if (!targetInWorkspace) continue;

        if (targetInWorkspace.role === 'owner' && current.role !== 'owner') {
          throw new Error(
            `Không thể thay đổi vai trò của Owner: ${user.email}`,
          );
        }

        if (
          targetInWorkspace.role === current.role &&
          currentUserId !== targetInWorkspace.user_id
        ) {
          throw new Error(
            `Không thể thay đổi vai trò của người cùng cấp: ${user.email}`,
          );
        }

        const targetInBoard = await tx.board_users.findUnique({
          where: {
            board_id_user_id: {
              user_id: userRecord.id,
              board_id: boardId,
            },
          },
        });

        if (!targetInBoard) continue; // xử lý nếu user bị kick rồi

        await tx.board_users.update({
          where: {
            board_id_user_id: {
              user_id: userRecord.id,
              board_id: boardId,
            },
          },
          data: {
            role: user.role,
          },
        });

        updatedUsers.push({
          email: user.email,
          newRole: user.role,
        });
      }
      return {
        message: 'Cập nhật vai trò thành công cho một số người dùng.',
        updated: updatedUsers,
      };
    });
  }

  async kickUsersByEmail(
    workspaceId: string,
    boardId: string,
    currentUserId: string,
    dto: AddBoardUsersDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await tx.workspace_users.findUnique({
        where: {
          workspace_id_user_id: {
            user_id: currentUserId,
            workspace_id: workspaceId,
          },
        },
      });

      if (!current) {
        throw new Error('Người dùng không tồn tại trong workspace.');
      }

      if (current.role === 'member') {
        throw new Error('Bạn không có quyền thêm người khác.');
      }

      const workspace = await tx.workspaces.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) throw new NotFoundException('Workspace not found');

      const board = await tx.boards.findUnique({
        where: { id: boardId },
      });

      if (!board) throw new NotFoundException('Board not found');

      const kickedUsers: { email: string; role: BoardRole }[] = [];
      for (const userData of dto.users) {
        const user = await tx.users.findUnique({
          where: { email: userData.email },
        });
        if (!user) continue;

        const targetUserInWorkspace = await tx.workspace_users.findUnique({
          where: {
            workspace_id_user_id: {
              user_id: user.id,
              workspace_id: workspaceId,
            },
          },
        });

        if (
          targetUserInWorkspace?.role == 'owner' ||
          targetUserInWorkspace?.role == current.role
        )
          throw new Error('Bạn không có thể kick owner hoặc người cùng cấp.');

        const targetUserInBoard = await tx.board_users.findUnique({
          where: {
            board_id_user_id: {
              user_id: user.id,
              board_id: boardId,
            },
          },
        });

        if (!targetUserInBoard)
          throw new Error('Người dùng không tồn tại trong Board.');

        try {
          const newBoardUser = await tx.board_users.delete({
            where: {
              board_id_user_id: {
                board_id: boardId,
                user_id: user.id,
              },
            },
          });

          kickedUsers.push({
            email: user.email,
            role: newBoardUser.role,
          });
        } catch (err) {
          // Bỏ qua lỗi user đã tồn tại, hoặc có thể throw nếu muốn rollback toàn bộ
          // throw err;
        }
      }
      return {
        message: `Kicked ${kickedUsers.length} users to board`,
        users: kickedUsers,
      };
    });
  }

  async setNameBoard(
    boardId: string,
    currentUserId: string,
    dto: CreateBoardDto,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const current = await tx.board_users.findUnique({
        where: {
          board_id_user_id: {
            user_id: currentUserId,
            board_id: boardId,
          },
        },
      });

      if (!current) {
        throw new Error('Người dùng không tồn tại trong workspace.');
      }

      if (current.role !== 'editor') {
        throw new Error('Bạn không có quyền chỉnh sửa.');
      }
      return tx.boards.update({
        where: {
          id: boardId,
        },
        data: {
          name: dto.name,
        },
      });
    });
  }

  // @Controller('/boards')
  async searchBoardsByUserAcrossAllWorkspaces(userId: string, name: string) {
    return this.prisma.boards.findMany({
      where: {
        board_users: {
          some: {
            user_id: userId,
          },
        },
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getAllBoardAcrossAllWorkspaces(userId: string) {
    return this.prisma.boards.findMany({
      where: {
        board_users: {
          some: {
            user_id: userId,
          },
        },
      },
    });
  }
}
