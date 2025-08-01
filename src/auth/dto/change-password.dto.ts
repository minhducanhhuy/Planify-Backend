import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString()
  oldPassword: string;

  @IsString()
  @MinLength(6)
  @Matches(/(?=.*[a-z])/, { message: 'Mật khẩu cần có ít nhất 1 chữ thường' })
  @Matches(/(?=.*[A-Z])/, { message: 'Mật khẩu cần có ít nhất 1 chữ in hoa' })
  @Matches(/(?=.*\d)/, { message: 'Mật khẩu cần có ít nhất 1 số' })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Mật khẩu cần có ít nhất 1 ký tự đặc biệt',
  })
  newPassword: string;
}
