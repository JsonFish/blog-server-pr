import { Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

import { JwtConfigEnum } from '@/common/enum/config.enum';
import { PrismaService } from '@/common/prisma/prisma.service';

@Injectable()
export class SocketService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  private server: Server;

  setServer(server: Server) {
    this.server = server;
  }

  // 处理连接
  async handleConnection(client: Socket) {
    const token = (client.handshake.auth.token as string).split(' ')[1];

    if (!token) {
      client.disconnect();

      return;
    }

    try {
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>(JwtConfigEnum.JWT_SECRET),
      });

      client.data = {
        user_id: payload.sub,
        name: payload.username,
      };
    } catch (error) {
      console.error('JWT verification failed:', error);
      client.disconnect();
    }
  }

  // 处理断开连接
  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }
}
