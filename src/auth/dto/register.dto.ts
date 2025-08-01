import { IsEmail, IsNotEmpty, Matches, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/(?=.*[a-z])/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ thường',
  })
  @Matches(/(?=.*[A-Z])/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa',
  })
  @Matches(/(?=.*\d)/, {
    message: 'Mật khẩu phải chứa ít nhất 1 chữ số',
  })
  @Matches(/(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt',
  })
  password: string;
}
