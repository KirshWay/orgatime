import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { unlink } from 'fs/promises';
import { diskStorage } from 'multer';
import { join } from 'path';
import { convertToWebp, imageFileFilter } from 'src/utils/file-upload.utils';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @ApiOperation({ summary: 'Get user profile' })
  @Get('profile')
  async getProfile(@Req() req: Request) {
    const user = req.user as { id: string };
    return this.usersService.getProfile(user.id);
  }

  @ApiOperation({ summary: 'Update user profile' })
  @Patch('profile')
  async updateProfile(@Body() dto: UpdateProfileDto, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.usersService.updateProfile(user.id, dto);
  }

  @ApiOperation({ summary: 'Change user password' })
  @Post('change-password')
  async changePassword(@Body() dto: ChangePasswordDto, @Req() req: Request) {
    const user = req.user as { id: string };
    await this.usersService.changePassword(user.id, dto);
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
  @UseInterceptors(
    FileInterceptor('avatar', {
      fileFilter: imageFileFilter,
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    if (!file) {
      throw new BadRequestException('File is not an image');
    }

    const user = req.user as { id: string };

    const existingUser = await this.usersService.findById(user.id);

    if (existingUser?.avatar) {
      const parts = existingUser.avatar.split('/');
      const filename = parts[parts.length - 1];
      const oldAvatarPath = join(process.cwd(), 'uploads', 'avatars', filename);
      try {
        await unlink(oldAvatarPath);
      } catch (error) {
        console.error(`Failed to delete old avatar: ${oldAvatarPath}`, error);
      }
    }

    const destination = join(process.cwd(), 'uploads', 'avatars');
    const { path: avatarUrl } = await convertToWebp(file, destination);

    await this.usersService.updateAvatar(user.id, avatarUrl);
    return { avatarUrl };
  }
}
