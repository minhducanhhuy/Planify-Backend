// src/workspaces/workspaces.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateWorkspaceUserRoleDto } from './dto/UpdateWorkspaceUserRoleDto';

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
      include: {
        workspace_users: {
          include: {
            users: {
              select: {
                full_name: true,
                email: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });
  }

  async getWorkspaceMembers(workspaceId: string) {
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

  async inviteUser(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    // Không cho tự mời chính mình
    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'You cannot invite yourself to the workspace',
      );
    }

    // Kiểm tra xem user đã có trong workspace chưa
    const existing = await this.prisma.workspace_users.findFirst({
      where: {
        workspace_id: workspaceId,
        user_id: targetUserId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'User is already a member of this workspace',
      );
    }

    // Nếu hợp lệ thì thêm
    return this.prisma.workspace_users.create({
      data: {
        workspace_id: workspaceId,
        user_id: targetUserId,
      },
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

  async updateUserRole(
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

    const target = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: dto.userId,
        },
      },
    });

    console.log('current:', current);
    console.log('target:', target);

    if (!target || !current)
      throw new Error('Người dùng không tồn tại trong workspace.');

    if (target.role === 'owner') {
      throw new Error('Không thể thay đổi vai trò của Owner.');
    }

    if (current.role === 'admin' && target.role === 'admin') {
      throw new Error('Admin không thể thay đổi vai trò của Admin khác.');
    }

    if (current.role === 'member') {
      throw new Error('Bạn không có quyền thay đổi vai trò người khác.');
    }

    if (currentUserId === target.user_id) {
      throw new BadRequestException(
        'Không thể tự cập nhật vai trò của bản thân',
      );
    }

    return this.prisma.workspace_users.update({
      where: {
        workspace_id_user_id: {
          user_id: dto.userId,
          workspace_id: workspaceId,
        },
      },
      data: {
        role: dto.role,
      },
    });
  }

  async kickUser(
    workspaceId: string,
    currentUserId: string,
    targetUserId: string,
  ) {
    const current = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          user_id: currentUserId,
          workspace_id: workspaceId,
        },
      },
    });

    const target = await this.prisma.workspace_users.findUnique({
      where: {
        workspace_id_user_id: {
          workspace_id: workspaceId,
          user_id: targetUserId,
        },
      },
    });

    //  console.log('Xoá user', {
    //    workspaceId,
    //    currentUserId,
    //    targetUserId,
    //  });

    //  console.log('sau khi tìm ', {
    //    current,
    //    target,
    //  });
    if (!target || !current)
      throw new Error('Người dùng không tồn tại trong workspace.');

    // Không cho xóa owner
    if (target.role === 'owner') {
      throw new Error('Không thể xóa Owner khỏi workspace.');
    }

    // Admin không được xóa Admin khác
    if (current.role === 'admin' && target.role === 'admin') {
      throw new Error('Admin không thể xóa Admin khác.');
    }

    // Member không được quyền xóa ai cả
    if (current.role === 'member') {
      throw new Error('Bạn không có quyền xóa người khác.');
    }

    if (currentUserId === targetUserId) {
      throw new BadRequestException(
        'Không thể tự xoá chính mình khỏi workspace',
      );
    }

    return this.prisma.workspace_users.delete({
      where: {
        workspace_id_user_id: {
          user_id: targetUserId,
          workspace_id: workspaceId,
        },
      },
    });
  }
}
