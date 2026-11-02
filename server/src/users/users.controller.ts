import {
  Body,
  Controller,
  Get,
  Header,
  StreamableFile,
  Patch,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUserId } from 'src/common/decorators/current-user-id.decorator';
import type {
  CookieReplyLike,
  MultipartRequestLike,
} from 'src/common/http/http.types';
import { RefreshTokenCookieService } from 'src/common/services/refresh-token-cookie.service';
import { AvatarService } from './avatar.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
    private readonly refreshTokenCookieService: RefreshTokenCookieService,
  ) {}

  @ApiOperation({ summary: 'Get user profile' })
  @Get('profile')
  async getProfile(@CurrentUserId() userId: string) {
    return this.usersService.getProfile(userId);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @Patch('profile')
  async updateProfile(
    @Body() dto: UpdateProfileDto,
    @CurrentUserId() userId: string,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @ApiOperation({ summary: 'Change user password' })
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Res({ passthrough: true }) reply: CookieReplyLike,
    @CurrentUserId() userId: string,
  ) {
    await this.usersService.changePassword(userId, dto);
    this.refreshTokenCookieService.clear(reply);
    return { message: 'Password updated successfully' };
  }

  @Get('avatar/content')
  @Header('Cache-Control', 'private, no-store')
  @Header('X-Content-Type-Options', 'nosniff')
  async getAvatarContent(@CurrentUserId() userId: string) {
    const { buffer, type } = await this.avatarService.getContent(userId);
    return new StreamableFile(buffer, { type, length: buffer.length });
  }

  @ApiOperation({ summary: 'Upload or update user avatar' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @Post('avatar')
  async uploadAvatar(
    @Req() request: MultipartRequestLike,
    @CurrentUserId() userId: string,
  ) {
    return this.avatarService.upload(userId, request);
  }
}
