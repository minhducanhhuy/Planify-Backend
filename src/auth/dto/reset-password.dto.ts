import { IsString, MinLength, Matches } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Mật khẩu phải có ít nhất một chữ thường',
  })
  @Matches(/(?=.*[A-Z])/, { message: 'Mật khẩu phải có ít nhất một chữ hoa' })
  @Matches(/(?=.*\d)/, { message: 'Mật khẩu phải có ít nhất một số' })
  @Matches(/(?=.*[@$!%*?&])/, {
    message: 'Mật khẩu phải có ít nhất một ký tự đặc biệt',
  })
  newPassword: string;
}
