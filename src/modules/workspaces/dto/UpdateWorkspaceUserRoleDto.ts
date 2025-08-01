import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class UpdateWorkspaceUserRoleDto {
  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
