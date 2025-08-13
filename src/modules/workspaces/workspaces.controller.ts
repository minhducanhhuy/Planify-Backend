// src/workspaces/workspaces.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AddWorkspaceUsersDto } from './dto/AddWorkspaceUsersDto';
import { CreateWorkspaceDto } from './dto/CreateWorkspaceDto';
import { UpdateWorkspaceUserRoleDto } from './dto/UpdateWorkspaceUserRoleDto';
import { KickUsersDto } from './dto/KickUsersDto';
import { AuthUser } from '../../auth/decorators/auth-user.decorator';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('')
  async create(
    @Body() dto: CreateWorkspaceDto,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.createWorkspace(dto.name, user.id);
  }

  @Get('')
  async getAllWorkspaces(@AuthUser() user: Express.User) {
    return this.workspacesService.getUserWorkspaces(user.id);
  }

  @Get(':workspaceId')
  async getWorkspaceById(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.getWorkspaceById(workspaceId, user.id);
  }

  @Get(':workspaceId/members')
  async getMembers(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.getWorkspaceMembers(workspaceId, user.id);
  }

  // workspaces.controller.ts
  @Post(':workspaceId/members')
  async addMany(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: AddWorkspaceUsersDto,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.addUsersByEmail(workspaceId, user.id, dto);
  }

  @Delete(':workspaceId')
  async deleteWorkspace(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.deleteWorkspace(workspaceId, user.id);
  }

  // PATCH /workspaces/:workspaceId/role
  @Patch(':workspaceId/members/role')
  async updateUsersRole(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: UpdateWorkspaceUserRoleDto,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.updateUsersRole(workspaceId, user.id, dto);
  }

  @Delete(':workspaceId/members')
  async kickUsers(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: KickUsersDto,
    @AuthUser() user: Express.User,
  ) {
    const emails = dto.users.map((user) => user.email);
    return this.workspacesService.kickUsersByEmail(
      workspaceId,
      user.id,
      emails,
    );
  }

  @Delete(':workspaceId/members/me')
  async leaveWorkspace(
    @Param('workspaceId') workspaceId: string,
    @AuthUser() user: Express.User,
  ) {
    return this.workspacesService.leaveWorkspace(workspaceId, user.id);
  }
}
