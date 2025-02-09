// src/common/services/event-emitter.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { SocketEvents } from '@/common/enum/event';
import { MarkNotificationsAsReadDto, UserLikeNotificationPayload } from '@/common/dto/event.dto';

@Injectable()
export class EventEmitterService {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  // 用户点赞通知
  emitUserLikeNotification(payload: UserLikeNotificationPayload) {
    this.eventEmitter.emit(SocketEvents.UserLikeNotification, payload);
  }

  emitMarkNotificationsAsRead(payload: MarkNotificationsAsReadDto) {
    this.eventEmitter.emit(SocketEvents.MarkNotificationsAsRead, payload);
  }
}
