import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClientIp } from 'src/common/decorators/client-ip.decorator';
import { CookieValue } from 'src/common/decorators/cookie-value.decorator';
import type { CookieReplyLike } from 'src/common/http/http.types';
import { RefreshTokenCookieService } from 'src/common/services/refresh-token-cookie.service';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  private readonly supportEmail =
    process.env.SUPPORT_EMAIL || 'support@example.com';

  private registrationAttempts: Map<
    string,
    { count: number; pending: number; lastAttempt: Date }
  > = new Map();
  private readonly MAX_REGISTER_ATTEMPTS = 3;
  private readonly REGISTER_COOLDOWN = 60 * 60 * 1000;

  constructor(
    private readonly authService: AuthService,
    private readonly refreshTokenCookieService: RefreshTokenCookieService,
  ) {}

  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully.' })
  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @ClientIp() clientIp: string,
    @Res({ passthrough: true }) reply: CookieReplyLike,
  ) {
    const attempts = this.reserveRegistration(clientIp);
    try {
      const result = await this.authService.register(registerDto);
      attempts.count += 1;
      attempts.lastAttempt = new Date();
      this.refreshTokenCookieService.set(reply, result.refreshToken);

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    } finally {
      attempts.pending -= 1;
      if (attempts.count === 0 && attempts.pending === 0) {
        this.registrationAttempts.delete(clientIp);
      }
    }
  }

  @ApiOperation({ summary: 'Login an existing user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully.' })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) reply: CookieReplyLike,
  ) {
    const result = await this.authService.login(loginDto);

    this.refreshTokenCookieService.set(reply, result.refreshToken);

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @ApiOperation({ summary: 'Logout user' })
  @Post('logout')
  async logout(
    @Headers('authorization') authorization: unknown,
    @CookieValue('refreshToken') refreshToken: string | undefined,
    @Res({ passthrough: true }) reply: CookieReplyLike,
  ) {
    this.refreshTokenCookieService.clear(reply);
    await this.authService.logoutFromCredentials(authorization, refreshToken);

    return { message: 'Logged out successfully' };
  }

  @ApiOperation({ summary: 'Refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully.' })
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body('refreshToken') refreshTokenFromBody: unknown,
    @CookieValue('refreshToken') refreshTokenFromCookie: string | undefined,
    @Res({ passthrough: true }) reply: CookieReplyLike,
  ) {
    const refreshToken = refreshTokenFromBody ?? refreshTokenFromCookie;
    const tokens = await this.authService.refreshToken(refreshToken);

    this.refreshTokenCookieService.set(reply, tokens.refreshToken);

    return { accessToken: tokens.accessToken };
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({
    status: 200,
    description: 'Password recovery instructions returned',
  })
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    await this.authService.forgotPassword(forgotPasswordDto);

    return {
      message: `If the specified email is registered in the system, write to ${this.supportEmail} for password recovery instructions`,
    };
  }

  @ApiOperation({ summary: 'Reset password using token' })
  @ApiResponse({ status: 200, description: 'Password reset successfully.' })
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'The password has been successfully reset' };
  }

  private reserveRegistration(ip: string) {
    let attempts = this.registrationAttempts.get(ip);
    const now = new Date();
    if (!attempts) {
      attempts = { count: 0, pending: 0, lastAttempt: now };
      this.registrationAttempts.set(ip, attempts);
    } else if (
      now.getTime() - attempts.lastAttempt.getTime() >
      this.REGISTER_COOLDOWN
    ) {
      attempts.count = 0;
      attempts.lastAttempt = now;
    }

    if (attempts.count + attempts.pending >= this.MAX_REGISTER_ATTEMPTS) {
      throw new HttpException(
        'Too many registration attempts. Please try again later.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    attempts.pending += 1;
    return attempts;
  }
}
