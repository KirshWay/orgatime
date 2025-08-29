import {
  ConflictException,
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private passwordResetRequests: Map<string, Date> = new Map();
  private readonly PASSWORD_RESET_COOLDOWN = 3 * 60 * 1000;

  private loginAttempts: Map<string, { count: number; lastAttempt: Date }> =
    new Map();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_LOCKOUT_TIME = 15 * 60 * 1000;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const user = await this.usersService.create({
      ...registerDto,
      password: hashedPassword,
    });

    const accessToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  async login(loginDto: LoginDto) {
    this.checkLoginAttempts(loginDto.email);

    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      this.recordFailedLoginAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    const isValid = await bcrypt.compare(loginDto.password, user.password);

    if (!isValid) {
      this.recordFailedLoginAttempt(loginDto.email);
      throw new UnauthorizedException('Invalid email or password');
    }

    this.loginAttempts.delete(loginDto.email);

    const accessToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);

    await this.usersService.updateRefreshToken(user.id, hashedRefreshToken);

    return {
      accessToken,
      refreshToken,
      user: {
        email: user.email,
        username: user.username,
        avatar: user.avatar,
      },
    };
  }

  private checkLoginAttempts(email: string): void {
    const attempts = this.loginAttempts.get(email);

    if (!attempts) {
      return;
    }

    const now = new Date();
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();

    if (timeSinceLastAttempt > this.LOGIN_LOCKOUT_TIME) {
      this.loginAttempts.delete(email);
      return;
    }

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      const minutesLeft = Math.ceil(
        (this.LOGIN_LOCKOUT_TIME - timeSinceLastAttempt) / 1000 / 60,
      );

      throw new HttpException(
        `Too many failed login attempts. Please try again in ${minutesLeft} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private recordFailedLoginAttempt(email: string): void {
    const attempts = this.loginAttempts.get(email);
    const now = new Date();

    if (!attempts) {
      this.loginAttempts.set(email, { count: 1, lastAttempt: now });
      return;
    }

    if (
      now.getTime() - attempts.lastAttempt.getTime() >
      this.LOGIN_LOCKOUT_TIME
    ) {
      this.loginAttempts.set(email, { count: 1, lastAttempt: now });
      return;
    }

    attempts.count += 1;
    attempts.lastAttempt = now;
  }

  async logout(userId: string) {
    return this.usersService.updateRefreshToken(userId, null);
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  async refreshToken(providedRefreshToken: string) {
    let payload: { sub: string };

    try {
      payload = this.jwtService.verify(providedRefreshToken, {
        ignoreExpiration: true,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access Denied');
    }

    const isRefreshTokenMatching = await bcrypt.compare(
      providedRefreshToken,
      user.refreshToken,
    );

    if (!isRefreshTokenMatching) {
      throw new UnauthorizedException('Access Denied');
    }

    const newAccessToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );

    const newRefreshToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '7d' },
    );
    const newHashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);

    await this.usersService.updateRefreshToken(user.id, newHashedRefreshToken);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
  ): Promise<{ resetUrl: string } | void> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const lastResetRequest = this.passwordResetRequests.get(dto.email);
    const now = new Date();

    if (
      lastResetRequest &&
      now.getTime() - lastResetRequest.getTime() < this.PASSWORD_RESET_COOLDOWN
    ) {
      const cooldownRemaining = Math.ceil(
        (this.PASSWORD_RESET_COOLDOWN -
          (now.getTime() - lastResetRequest.getTime())) /
          1000 /
          60,
      );

      throw new HttpException(
        `Too many password reset requests. Please try again in ${cooldownRemaining} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await this.usersService.setPasswordResetToken(
      user.id,
      hashedToken,
      expires,
    );

    this.passwordResetRequests.set(dto.email, now);

    const resetUrl = this.generateResetPasswordUrl(user.email, resetToken);

    return { resetUrl };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');
    const user = await this.usersService.findByPasswordResetToken(hashedToken);

    if (
      !user ||
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }
    const newHashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.usersService.updatePassword(user.id, newHashedPassword);
    await this.usersService.clearPasswordResetToken(user.id);
  }

  private generateResetPasswordUrl(email: string, token: string): string {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173/';
    const resetUrl = `${frontendUrl}auth/reset-password?token=${token}`;
    return resetUrl;
  }
}
