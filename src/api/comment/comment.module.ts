import { Module } from '@nestjs/common';

import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';

import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  controllers: [CommentController],
  providers: [CommentService],
  imports: [PrismaModule],
})
export class CommentModule {}
