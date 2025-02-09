import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { differenceInMinutes } from 'date-fns';

import { PrismaService } from '@/common/prisma/prisma.service';
import { SocketEvents } from '@/common/enum/event';

@WebSocketGateway(81, {
  namespace: 'event',
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    allowedHeaders: ['Authorization'],
  },
  transports: ['websocket'],
})
export class SocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly prisma: PrismaService) {}

  private server: Server;

  afterInit(server: Server) {
    this.server = server;
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);

    const userId = client.handshake.query.userId as string;

    if (userId) {
      client.join(`user_${userId}`);
      console.log(`Client ${client.id} joined room user_${userId}`);
    } else {
      console.log('User ID not provided, disconnecting client.');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 处理发送消息事件
  @SubscribeMessage(SocketEvents.MessageSend)
  async handleSendMessage(
    @MessageBody() payload: { user_id: string; receiverId: string; content: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { user_id, receiverId, content } = payload;

    let chat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          { user1Id: user_id, user2Id: receiverId },
          { user1Id: receiverId, user2Id: user_id },
        ],
      },
    });

    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          user1Id: user_id,
          user2Id: receiverId,
        },
      });
    }

    const messageCount = await this.prisma.message.count({
      where: {
        chat_id: chat.id,
      },
    });

    if (messageCount === 1) {
      const firstMessage = await this.prisma.message.findFirst({
        where: {
          chat_id: chat.id,
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      if (firstMessage?.user_id === user_id) {
        const validReplyExists = await this.prisma.message.findFirst({
          where: {
            chat_id: chat.id,
            user_id: receiverId,
            is_revoked: false,
          },
        });

        if (!validReplyExists) {
          client.emit(SocketEvents.ErrorResponse, {
            message: 'You can only send one greeting message until the recipient replies.',
          });

          return;
        }
      }
    }

    const message = await this.prisma.message.create({
      data: {
        content,
        user_id,
        chat_id: chat.id,
      },
    });

    await this.prisma.chatUser.updateMany({
      where: {
        chatId: chat.id,
        userId: receiverId,
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    this.server.to(`user_${receiverId}`).emit(SocketEvents.MessageReceptionByReceiver, message);
    client.emit(SocketEvents.MessageDeliveryConfirmation, message);
  }

  // 处理撤回消息事件
  @SubscribeMessage(SocketEvents.MessageRevoke)
  async handleRevokeMessage(
    @MessageBody() payload: { messageId: number; senderId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const { messageId, senderId } = payload;

    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      client.emit(SocketEvents.ErrorResponse, { message: 'Message not found.' });

      return;
    }

    if (message.is_revoked) {
      client.emit(SocketEvents.ErrorResponse, { message: 'Message has already been revoked.' });

      return;
    }

    if (message.user_id !== senderId) {
      client.emit(SocketEvents.ErrorResponse, {
        message: 'You are not authorized to revoke this message.',
      });

      return;
    }

    const now = new Date();
    const minutesDifference = differenceInMinutes(now, message.created_at);

    if (minutesDifference > 3) {
      client.emit(SocketEvents.ErrorResponse, {
        message: 'Message can only be revoked within three minutes of sending.',
      });

      return;
    }

    await this.prisma.message.update({
      where: { id: messageId },
      data: { is_revoked: true },
    });

    const chatId = message.chat_id;

    this.server.to(`chat_${chatId}`).emit(SocketEvents.MessageRevocationBroadcast, {
      messageId,
      chatId,
      message: 'A message has been revoked.',
    });

    client.emit(SocketEvents.MessageRevocationConfirmationToSender, { messageId });
  }
}
