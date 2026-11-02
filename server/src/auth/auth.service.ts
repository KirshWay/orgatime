import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { parseTokenClaims, readSession, storeSession } from './session';

@Injectable()
export class AuthService implements OnModuleInit, OnModuleDestroy {
  private passwordResetRequests: Map<string, Date> = new Map();
  private readonly PASSWORD_RESET_COOLDOWN = 3 * 60 * 1000;

  private loginAttempts = new Map<
    string,
    { failures: number; pending: number; lastAttempt: Date }
  >();
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOGIN_LOCKOUT_TIME = 15 * 60 * 1000;

  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  onModuleInit() {
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleMaps(),
      30 * 60 * 1000,
    );
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  private cleanupStaleMaps() {
    const now = Date.now();

    for (const [email, attempts] of this.loginAttempts) {
      if (
        attempts.pending === 0 &&
        now - attempts.lastAttempt.getTime() > this.LOGIN_LOCKOUT_TIME
      ) {
        this.loginAttempts.delete(email);
      }
    }

    for (const [email, date] of this.passwordResetRequests) {
      if (now - date.getTime() > this.PASSWORD_RESET_COOLDOWN) {
        this.passwordResetRequests.delete(email);
      }
    }
  }

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

    const { accessToken, refreshToken, session } = this.issueTokens(user.id);
    const stored = await this.usersService.startSession(
      user.id,
      user.password,
      session,
    );
    if (!stored) throw new UnauthorizedException('Credentials have changed');

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
    const attempts = this.reserveLogin(loginDto.email);
    try {
      const user = await this.usersService.findByEmail(loginDto.email);
      const isValid =
        user && (await bcrypt.compare(loginDto.password, user.password));
      if (!user || !isValid) {
        attempts.failures += 1;
        attempts.lastAttempt = new Date();
        throw new UnauthorizedException('Invalid email or password');
      }

      attempts.failures = 0;
      const { accessToken, refreshToken, session } = this.issueTokens(user.id);
      const stored = await this.usersService.startSession(
        user.id,
        user.password,
        session,
      );
      if (!stored) throw new UnauthorizedException('Credentials have changed');

      return {
        accessToken,
        refreshToken,
        user: {
          email: user.email,
          username: user.username,
          avatar: user.avatar,
        },
      };
    } finally {
      attempts.pending -= 1;
      if (attempts.failures === 0 && attempts.pending === 0) {
        this.loginAttempts.delete(loginDto.email);
      }
    }
  }

  private reserveLogin(email: string) {
    let attempts = this.loginAttempts.get(email);
    const now = new Date();
    if (!attempts) {
      attempts = { failures: 0, pending: 0, lastAttempt: now };
      this.loginAttempts.set(email, attempts);
    }
    const timeSinceLastAttempt = now.getTime() - attempts.lastAttempt.getTime();
    if (timeSinceLastAttempt > this.LOGIN_LOCKOUT_TIME) {
      attempts.failures = 0;
      attempts.lastAttempt = now;
    }

    if (attempts.failures + attempts.pending >= this.MAX_LOGIN_ATTEMPTS) {
      const minutesLeft = Math.ceil(
        (this.LOGIN_LOCKOUT_TIME -
          (now.getTime() - attempts.lastAttempt.getTime())) /
          1000 /
          60,
      );

      throw new HttpException(
        `Too many failed login attempts. Please try again in ${minutesLeft} minutes.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    attempts.pending += 1;
    return attempts;
  }

  private issueTokens(userId: string, sid = crypto.randomUUID()) {
    const accessToken = this.jwtService.sign(
      { sub: userId, purpose: 'access', sid },
      { expiresIn: '1h', algorithm: 'HS256' },
    );
    const refreshToken = this.jwtService.sign(
      { sub: userId, purpose: 'refresh', sid, jti: crypto.randomUUID() },
      { expiresIn: '7d', algorithm: 'HS256' },
    );
    return {
      accessToken,
      refreshToken,
      session: storeSession(sid, refreshToken),
    };
  }

  async logout(userId: string, sid: string) {
    await this.usersService.endSession(userId, sid);
  }

  async logoutFromCredentials(authorization: unknown, refreshToken: unknown) {
    const accessToken =
      typeof authorization === 'string'
        ? /^Bearer +(\S+)$/i.exec(authorization)?.[1]
        : undefined;
    const claims =
      this.verifyLogoutToken(accessToken, 'access') ??
      this.verifyLogoutToken(refreshToken, 'refresh');
    if (claims) await this.logout(claims.sub, claims.sid);
  }

  private verifyLogoutToken(token: unknown, purpose: 'access' | 'refresh') {
    if (typeof token !== 'string' || !token) return null;
    try {
      return parseTokenClaims(
        this.jwtService.verify<Record<string, unknown>>(token, {
          algorithms: ['HS256'],
        }),
        purpose,
      );
    } catch {
      return null;
    }
  }

  async validateUser(userId: string, sid: string) {
    const user = await this.usersService.findById(userId);
    if (!user || readSession(user.refreshToken)?.sid !== sid) {
      throw new UnauthorizedException('Invalid token');
    }
    return { id: user.id, sid };
  }

  async refreshToken(providedRefreshToken: unknown) {
    if (typeof providedRefreshToken !== 'string' || !providedRefreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    let payload;
    try {
      payload = parseTokenClaims(
        this.jwtService.verify<Record<string, unknown>>(providedRefreshToken, {
          algorithms: ['HS256'],
        }),
        'refresh',
      );
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    const session = readSession(user?.refreshToken);
    if (
      !user ||
      !session ||
      session.sid !== payload.sid ||
      user.refreshToken !== storeSession(payload.sid, providedRefreshToken)
    ) {
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = this.issueTokens(user.id, payload.sid);
    const rotated = await this.usersService.rotateSession(
      user.id,
      user.refreshToken,
      tokens.session,
    );
    if (!rotated) throw new UnauthorizedException('Access Denied');

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
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

    this.passwordResetRequests.set(dto.email, now);
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

    const consumed = await this.usersService.consumePasswordResetToken(
      user.id,
      hashedToken,
      newHashedPassword,
    );
    if (!consumed) {
      throw new UnauthorizedException(
        'Password reset token is invalid or expired',
      );
    }
  }
}
