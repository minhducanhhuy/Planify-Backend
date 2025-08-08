import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkspaceRole } from '@prisma/client';

class AddUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(WorkspaceRole)
  role?: WorkspaceRole;
}

export class AddWorkspaceUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddUserDto)
  users: AddUserDto[];
}
