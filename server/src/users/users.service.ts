import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RegisterDto } from '../auth/dto/register.dto';
import { PrismaService } from '../prisma/prisma.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: RegisterDto & { password: string }) {
    return this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: data.password,
      },
    });
  }

  async startSession(userId: string, password: string, refreshToken: string) {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, password },
      data: { refreshToken },
    });
    return result.count === 1;
  }

  async rotateSession(userId: string, expected: string, refreshToken: string) {
    const result = await this.prisma.user.updateMany({
      where: { id: userId, refreshToken: expected },
      data: { refreshToken },
    });
    return result.count === 1;
  }

  async endSession(userId: string, sid: string) {
    await this.prisma.user.updateMany({
      where: { id: userId, refreshToken: { startsWith: `v1:${sid}:` } },
      data: { refreshToken: null },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async getProfile(userId: string) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const {
      id,
      createdAt,
      password,
      refreshToken,
      passwordResetToken,
      passwordResetExpires,
      ...profile
    } = user;

    return profile;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    if (dto.email) {
      const existingUser = await this.findByEmail(dto.email);

      if (existingUser && existingUser.id !== userId) {
        throw new ConflictException('Email is already in use');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { email: dto.email, username: dto.username },
    });

    const {
      id,
      createdAt,
      password,
      refreshToken,
      passwordResetToken,
      passwordResetExpires,
      ...profile
    } = updated;

    return profile;
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.password);

    if (!isMatch) {
      throw new UnauthorizedException('Old password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    const result = await this.prisma.user.updateMany({
      where: { id: userId, password: user.password },
      data: {
        password: hashedNewPassword,
        refreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    if (result.count !== 1) {
      throw new UnauthorizedException('Credentials have changed');
    }

    return { message: 'Password updated successfully' };
  }

  async setPasswordResetToken(userId: string, token: string, expires: Date) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    return { success: true };
  }

  async findByPasswordResetToken(hashedToken: string) {
    return this.prisma.user.findFirst({
      where: { passwordResetToken: hashedToken },
    });
  }

  async consumePasswordResetToken(
    userId: string,
    hashedToken: string,
    password: string,
  ) {
    const result = await this.prisma.user.updateMany({
      where: {
        id: userId,
        passwordResetToken: hashedToken,
        passwordResetExpires: { gt: new Date() },
      },
      data: {
        password,
        refreshToken: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });
    return result.count === 1;
  }
}
