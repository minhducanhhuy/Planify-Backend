// src/boards/dto/AddBoardUsersDto.ts
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { BoardRole } from '@prisma/client';

class AddUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsEnum(BoardRole)
  role?: BoardRole;
}

export class AddBoardUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AddUserDto)
  users: AddUserDto[];
}
