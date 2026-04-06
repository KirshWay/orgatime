import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
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
import type { MultipartRequestLike } from 'src/common/http/http.types';
import { ImageUploadService } from 'src/common/services/image-upload.service';
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
    private readonly imageUploadService: ImageUploadService,
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
    @CurrentUserId() userId: string,
  ) {
    await this.usersService.changePassword(userId, dto);
    return { message: 'Password updated successfully' };
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
    const existingUser = await this.usersService.findById(userId);
    const { avatarUrl } = await this.imageUploadService.uploadAvatar(
      request,
      existingUser?.avatar ?? undefined,
    );

    await this.usersService.updateAvatar(userId, avatarUrl);
    return { avatarUrl };
  }
}
