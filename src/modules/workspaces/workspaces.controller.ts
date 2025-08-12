// src/workspaces/workspaces.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Patch,
  Param,
  Delete,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { AddWorkspaceUsersDto } from './dto/AddWorkspaceUsersDto';
import { CreateWorkspaceDto } from './dto/CreateWorkspaceDto';
import { UpdateWorkspaceUserRoleDto } from './dto/UpdateWorkspaceUserRoleDto';
import { KickUsersDto } from './dto/KickUsersDto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('')
  async create(@Body() dto: CreateWorkspaceDto, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.createWorkspace(dto.name, userId);
  }

  @Get('myWorkspace')
  async getMyWorkspaces(@Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.getUserWorkspaces(userId);
  }

  @Get(':id')
  async getWorkspaceById(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.getWorkspaceById(id, userId);
  }

  @Get(':workspaceId/members')
  async getMembers(
    @Param('workspaceId') workspaceId: string,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.getWorkspaceMembers(workspaceId, userId);
  }

  // workspaces.controller.ts
  @Post(':id/add')
  async addMany(
    @Param('id') workspaceId: string,
    @Body() dto: AddWorkspaceUsersDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.addUsersByEmail(workspaceId, userId, dto);
  }

  @Delete(':id')
  async deleteWorkspace(@Param('id') id: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.deleteWorkspace(id, userId);
  }

  // PATCH /workspaces/:id/role
  @Patch(':id/role')
  async updateUsersRole(
    @Param('id') workspaceId: string,
    @Body() dto: UpdateWorkspaceUserRoleDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.updateUsersRole(workspaceId, userId, dto);
  }

  @Delete(':id/kick')
  async kickUsers(
    @Param('id') workspaceId: string,
    @Body() dto: KickUsersDto,
    @Req() req: Request,
  ) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    const emails = dto.users.map((user) => user.email);
    return this.workspacesService.kickUsersByEmail(workspaceId, userId, emails);
  }

  @Delete(':id/leave')
  async leaveWorkspace(@Param('id') workspaceId: string, @Req() req: Request) {
    if (!req.user) {
      throw new UnauthorizedException('User not found');
    }
    const userId = req.user.id;
    return this.workspacesService.leaveWorkspace(workspaceId, userId);
  }
}
