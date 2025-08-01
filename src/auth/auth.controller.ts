import { Body, ConsoleLogger, Controller, Patch, Post } from '@nestjs/common';
import { Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { read } from 'fs';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() dto: RegisterDto) {
    console.log('DTO:', dto);
    return this.authService.register(dto);
  }

  @Post('/login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // Google login redirect endpoint
  @UseGuards(AuthGuard('google'))
  @Get('/google')
  async googleAuth(@Req() req) {}

  @UseGuards(AuthGuard('google'))
  @Get('google/redirect')
  async googleAuthRedirect(@Req() req) {
    return this.authService.googleLogin(req.user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('/change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    console.log(req);
    return this.authService.changePassword(req.user.id, dto);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
