import { IsNotEmpty, IsString, IsEnum } from 'class-validator';
export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
