import {
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Injectable,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from 'prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { randomUUID } from 'crypto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  //   async register(dto: RegisterDto) {
  //     const userExists = await this.prisma.users.findUnique({
  //       where: { email: dto.email },
  //     });

  //     if (userExists) {
  //       throw new BadRequestException('Email is already registered');
  //     }

  //     const hashedPassword = await bcrypt.hash(dto.password, 10);

  //     const newUser = await this.prisma.users.create({
  //       data: {
  //         email: dto.email,
  //         password: hashedPassword,
  //         provider: 'local',
  //       },
  //     });

  //     return {
  //       message: 'Account created successfully',
  //       user: {
  //         id: newUser.id,
  //         email: newUser.email,
  //       },
  //     };
  //   }

  async login(dto: LoginDto) {
    const user = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.password) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync(
      { sub: user.id },
      {
        expiresIn: dto.remember ? '30d' : '1h', // 👈 thời hạn tùy theo rememberMe
      },
    );

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  async googleLogin(googleUser: { email: string }) {
    const email = googleUser.email;

    let user = await this.prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          email,
          provider: 'google',
        },
      });
    }

    const token = await this.jwtService.signAsync({ sub: user.id });

    return {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }

  //   async changePassword(userId: string, dto: ChangePasswordDto) {
  //     const user = await this.prisma.users.findUnique({ where: { id: userId } });

  //     if (!user || !user.password) {
  //       throw new BadRequestException('Tài khoản Google không thể đổi mật khẩu');
  //     }

  //     const isMatch = await bcrypt.compare(dto.oldPassword, user.password);
  //     if (!isMatch) {
  //       throw new UnauthorizedException('Mật khẩu cũ không đúng');
  //     }

  //     const newHashed = await bcrypt.hash(dto.newPassword, 10);

  //     await this.prisma.users.update({
  //       where: { id: userId },
  //       data: { password: newHashed },
  //     });

  //     return { message: 'Đổi mật khẩu thành công' };
  //   }

  //   async forgotPassword(dto: ForgotPasswordDto) {
  //     const user = await this.prisma.users.findUnique({
  //       where: { email: dto.email },
  //     });
  //     if (!user) throw new NotFoundException('User not found');

  //     const token = randomUUID();
  //     const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 phút

  //     await this.prisma.password_reset_tokens.create({
  //       data: {
  //         user_id: user.id,
  //         token,
  //         expires_at: expiresAt,
  //       },
  //     });

  //     // TODO: gửi email thực tế, ở đây log ra
  //     //  console.log(
  //     //    `Reset link: https://yourdomain.com/reset-password?token=${token}`,
  //     //  );

  //     return { message: 'Gửi link forgot thành công' };
  //   }

  //   async resetPassword(dto: ResetPasswordDto) {
  //     const resetToken = await this.prisma.password_reset_tokens.findUnique({
  //       where: { token: dto.token },
  //       include: { user: true },
  //     });

  //     if (!resetToken || resetToken.used || new Date() > resetToken.expires_at) {
  //       throw new BadRequestException('Token is invalid or expired');
  //     }

  //     const passwordHash = await bcrypt.hash(dto.newPassword, 10);

  //     await this.prisma.$transaction([
  //       this.prisma.users.update({
  //         where: { id: resetToken.user_id },
  //         data: { password: passwordHash },
  //       }),
  //       this.prisma.password_reset_tokens.update({
  //         where: { token: dto.token },
  //         data: { used: true },
  //       }),
  //     ]);

  //     return { message: 'Reset mật khẩu thành công' };
  //   }
}
