import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { UserService } from './user.service';
import { UserController } from './user.controller';

import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [PrismaModule, EventEmitterModule.forRoot()],
})
export class UserModule {}
