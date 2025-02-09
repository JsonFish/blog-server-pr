import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { SocketService } from './socket.service';
import { SocketGateway } from './socket.gateway';

import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  providers: [SocketGateway, SocketService, JwtService],
  imports: [PrismaModule],
})
export class SocketModule {}
