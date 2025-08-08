// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceUserRoleDto } from './dto/UpdateWorkspaceUserRoleDto';
import { WorkspaceRole } from '@prisma/client';
import { AddWorkspaceUsersDto } from './dto/AddWorkspaceUsersDto';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async createWorkspace(name: string, userId: string) {
    return this.prisma.workspaces.create({
      data: {
        name,
        created_by: userId,
        workspace_users: {
          create: {
            user_id: userId,
            role: 'owner',
          },
        },
      },
    });
  }

  async getUserWorkspaces(userId: string) {
    return this.prisma.workspaces.findMany({
      where: {
        workspace_users: {
          some: {
            user_id: userId,
          },
        },
      },
      select: {
        id: true,
        name: true,
        created_by: true,
      },
    });
  }

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    const user = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: userId,
        },
      },
    });

    if (!user) {
      throw new ForbiddenException('User does not belong to this workspace');
    }

    const members = await this.prisma.workspace_users.findMany({
      where: {
        workspace_id: workspaceId,
      },
      include: {
        users: {
          select: {
            id: true,
            full_name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    return members.map((member) => ({
      userId: member.users?.id,
      fullName: member.users?.full_name,
      email: member.users?.email,
      avatarUrl: member.users?.avatar_url,
      role: member.role,
    }));
  }

  async getWorkspaceById(workspaceId: string, userId: string) {
    const workspace = await this.prisma.workspaces.findUnique({
      where: { id: workspaceId },
      include: {
        workspace_users: true, // đây là danh sách thành viên kèm user_id, role,...
      },
    });

    if (!workspace) throw new NotFoundException('Workspace not found');

    // Kiểm tra người dùng có trong workspace không
    const isMember = workspace.workspace_users.some(
      (wu) => wu.user_id === userId,
    );

    if (!isMember) throw new ForbiddenException('Access denied');

    return workspace;
  }

  async addUsersByEmail(
    workspaceId: string,
    currentUserId: string,
    dto: AddWorkspaceUsersDto,
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

      const workspace = await this.prisma.workspaces.findUnique({
        where: { id: workspaceId },
      });

      if (!workspace) throw new NotFoundException('Workspace not found');

      const addedUsers: { email: string; role: WorkspaceRole }[] = [];
      const existingMembers: { email: string }[] = [];
      for (const userData of dto.users) {
        const user = await tx.users.findUnique({
          where: { email: userData.email },
        });

        if (!user) continue;

        const existingMember = await tx.workspace_users.findUnique({
          where: {
            workspace_id_user_id: {
              workspace_id: workspaceId,
              user_id: user.id,
            },
          },
        });

        if (existingMember) {
          existingMembers.push({
            email: userData.email,
          });
          continue;
        }

        const newUsser = await tx.workspace_users.create({
          data: {
            workspace_id: workspaceId,
            user_id: user.id,
            role: userData.role ?? 'member',
          },
        });

        addedUsers.push({
          email: user.email,
          role: newUsser.role ?? 'member',
        });
      }

      return {
        message: `Added ${addedUsers.length} users to Workspace`,
        alreadyInWorkspace: existingMembers,
      };
    });
  }

  async deleteWorkspace(workspace_id: string, user_id: string) {
    // Kiểm tra quyền người dùng
    const member = await this.prisma.workspace_users.findFirst({
      where: { workspace_id, user_id },
    });

    if (!member || member.role !== 'owner') {
      throw new ForbiddenException('Bạn không có quyền xóa workspace này');
    }

    // Xóa luôn các quan hệ liên quan nếu cần
    return this.prisma.workspaces.delete({
      where: { id: workspace_id },
    });
  }

  async updateUsersRole(
    workspaceId: string,
    currentUserId: string,
    dto: UpdateWorkspaceUserRoleDto,
  ) {
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

    const updatedUsers: { email: string; newRole: WorkspaceRole }[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const user of dto.users) {
        const userRecord = await tx.users.findUnique({
          where: { email: user.email },
        });

        if (!userRecord) continue;

        if (userRecord.id === currentUserId) {
          throw new BadRequestException(
            'Không thể tự cập nhật vai trò của bản thân',
          );
        }

        const target = await tx.workspace_users.findUnique({
          where: {
            workspace_id_user_id: {
              user_id: userRecord.id,
              workspace_id: workspaceId,
            },
          },
        });

        if (!target) continue;

        if (target.role === 'owner') {
          throw new Error(
            `Không thể thay đổi vai trò của Owner: ${user.email}`,
          );
        }

        if (current.role === 'admin' && target.role === 'admin') {
          throw new Error(
            `Admin không thể thay đổi vai trò của Admin: ${user.email}`,
          );
        }

        await tx.workspace_users.update({
          where: {
            workspace_id_user_id: {
              user_id: userRecord.id,
              workspace_id: workspaceId,
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
    });

    return {
      message: 'Cập nhật vai trò thành công cho một số người dùng.',
      updated: updatedUsers,
    };
  }
  async kickUsersByEmail(
    workspaceId: string,
    currentUserId: string,
    targetEmails: string[],
  ) {
    return this.prisma.$transaction(async (tx) => {
      const current = await tx.workspace_users.findUnique({
        where: {
          workspace_id_user_id: {
            workspace_id: workspaceId,
            user_id: currentUserId,
          },
        },
      });

      if (!current) throw new Error('Bạn không thuộc workspace này.');

      if (current.role === 'member') {
        throw new Error('Bạn không có quyền xóa người khác.');
      }

      // Lấy users theo email
      const users = await tx.users.findMany({
        where: {
          email: { in: targetEmails },
        },
        select: { id: true, email: true },
      });

      if (!users.length) {
        throw new BadRequestException('Không tìm thấy người dùng hợp lệ.');
      }

      const kickedEmails: string[] = [];
      for (const user of users) {
        if (user.id === currentUserId) {
          continue; // không cho tự kick
        }

        const target = await tx.workspace_users.findUnique({
          where: {
            workspace_id_user_id: {
              workspace_id: workspaceId,
              user_id: user.id,
            },
          },
        });

        if (!target) continue;

        if (target.role === 'owner') {
          throw new Error(`Không thể xóa Owner: ${user.email}`);
        }

        if (target.role === 'admin' && current.role !== 'owner') {
          throw new Error(`Chỉ Owner mới được xóa Admin: ${user.email}`);
        }

        // 1. Xóa khỏi board_users trong các board thuộc workspace
        const boardsInWorkspace = await tx.boards.findMany({
          where: { workspace_id: workspaceId },
          select: { id: true },
        });

        const boardIds = boardsInWorkspace.map((b) => b.id);

        await tx.board_users.deleteMany({
          where: {
            user_id: user.id,
            board_id: { in: boardIds },
          },
        });

        // 2. Xóa khỏi workspace_users
        await tx.workspace_users.delete({
          where: {
            workspace_id_user_id: {
              workspace_id: workspaceId,
              user_id: user.id,
            },
          },
        });

        kickedEmails.push(user.email);
      }

      return {
        message: `Đã xóa ${kickedEmails.length} người khỏi workspace`,
        kicked: kickedEmails,
      };
    });
  }
}
