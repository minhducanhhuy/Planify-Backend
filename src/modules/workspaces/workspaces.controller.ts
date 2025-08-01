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
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard'; // nếu có
import { Request } from 'express';
import { InviteUserDto } from './dto/InviteUserDto';
import { CreateWorkspaceDto } from './dto/CreateWorkspaceDto';
import { UpdateWorkspaceUserRoleDto } from './dto/UpdateWorkspaceUserRoleDto';

@UseGuards(JwtAuthGuard)
@Controller('workspaces')
export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService) {}

  @Post('')
  async create(@Body() dto: CreateWorkspaceDto, @Req() req) {
    return this.workspacesService.createWorkspace(dto.name, req.user.id);
  }

  @Get('my')
  async getMyWorkspaces(@Req() req: Request) {
    const user = req.user as any;
    return this.workspacesService.getUserWorkspaces(user.id);
  }

  @Get(':id')
  async getWorkspaceById(@Param('id') id: string, @Req() req) {
    const userId = req.user.id;
    return this.workspacesService.getWorkspaceById(id, userId);
  }

  @Get(':workspaceId/members')
  async getMembers(@Param('workspaceId') workspaceId: string) {
    return this.workspacesService.getWorkspaceMembers(workspaceId);
  }

  @Post(':id/invite')
  async invite(
    @Param('id') id: string,
    @Body() dto: InviteUserDto,
    @Req() req,
  ) {
    return this.workspacesService.inviteUser(id, req.user.id, dto.userId);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Req() req) {
    return this.workspacesService.deleteWorkspace(id, req.user.id);
  }

  // PATCH /workspaces/:id/role
  @Patch(':id/role')
  async updateUserRole(
    @Param('id') workspaceId: string,
    @Body() dto: UpdateWorkspaceUserRoleDto,
    @Req() req,
  ) {
    return this.workspacesService.updateUserRole(workspaceId, req.user.id, dto);
  }

  // DELETE /workspaces/:id/kick/:userId
  @Delete(':id/kick/:userId')
  async kickUser(
    @Param('id') workspaceId: string,
    @Param('userId') targetUserId: string,
    @Req() req,
  ) {
    const currentUserId = req.user.id;
    return this.workspacesService.kickUser(
      workspaceId,
      currentUserId,
      targetUserId,
    );
  }
}
