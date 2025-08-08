// dto/UpdateWorkspaceUserRoleDto.ts
import { IsArray, ValidateNested, IsEmail, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspaceRole } from '@prisma/client';

class UserRoleItem {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}

export class UpdateWorkspaceUserRoleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleItem)
  users: UserRoleItem[];
}
