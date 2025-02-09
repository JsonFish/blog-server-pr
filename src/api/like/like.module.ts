import { Module } from '@nestjs/common';

import { LikeService } from './like.service';
import { LikeController } from './like.controller';

import { PrismaModule } from '@/common/prisma/prisma.module';
import { EventEmitterService } from '@/common/event/event-emitter.service';

@Module({
  controllers: [LikeController],
  providers: [LikeService, EventEmitterService],
  imports: [PrismaModule],
})
export class LikeModule {}
