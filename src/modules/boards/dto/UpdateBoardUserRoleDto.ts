import { IsArray, IsEmail, IsEnum, ValidateNested } from 'class-validator';
import { BoardRole } from '@prisma/client';
import { Type } from 'class-transformer';

class UserRoleItem {
  @IsEmail()
  email: string;

  @IsEnum(BoardRole)
  role: BoardRole;
}

export class UpdateBoardUserRoleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UserRoleItem)
  users: UserRoleItem[];
}
