import { Type } from 'class-transformer';
import { IsArray, ValidateNested, IsEmail } from 'class-validator';

class KickUser {
  @IsEmail()
  email: string;
}

export class KickUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KickUser)
  users: KickUser[];
}
