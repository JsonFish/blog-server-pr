import { Module } from '@nestjs/common';

import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

import { PrismaModule } from '@/common/prisma/prisma.module';
import { EventEmitterService } from '@/common/event/event-emitter.service';

@Module({
  controllers: [NotificationController],
  providers: [NotificationService, EventEmitterService],
  imports: [PrismaModule],
})
export class SseModule {}
