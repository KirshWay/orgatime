import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { AvatarService } from './avatar.service';

@Module({
  imports: [CommonModule, PrismaModule],
  providers: [UsersService, AvatarService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
