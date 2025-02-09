import {
  Controller,
  Sse,
  UseGuards,
  Request,
  Get,
  Query,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Subject } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OnEvent } from '@nestjs/event-emitter';

import { NotificationService } from './notification.service';
import { LikeNotificationDto, PaginationQueryDto } from './dto/index,dto';

import { SocketEvents } from '@/common/enum/event';
import { RequestWithUser } from '@/common/types';
import { ResponseDto } from '@/common/dto/response.dto';
import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';
import { MarkNotificationsAsReadDto, UserLikeNotificationPayload } from '@/common/dto/event.dto';

@ApiTags('消息推送')
@Controller('notification')
@UseGuards(AuthGuard('jwt'))
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @ApiOperation({
    summary: '建立 SSE 连接',
    description: '用于建立服务器与客户端的 SSE 连接，接收实时推送的通知和消息。',
  })
  @ApiResponse({ status: 200, description: '成功建立 SSE 连接' })
  @Sse()
  handleSse(@Request() req: RequestWithUser): Subject<MessageEvent> {
    const userId = req.user.id;

    // 如果用户 ID 不存在，抛出 BadRequestException
    if (!userId) {
      throw new BadRequestException('User ID is required to establish SSE connection.');
    }

    const subject = new Subject<MessageEvent>();
    this.notificationService['clients'].set(userId, subject);

    return subject;
  }

  @ApiOperation({
    summary: '获取未读消息数量',
    description: '根据用户 ID 获取不同类型通知和未读消息的总数。',
  })
  @ApiResponse({ status: 200, description: '成功获取未读消息数量' })
  @OnEvent(SocketEvents.FetchUnreadCounts)
  async fetchUnreadCounts(payload: { userId: string }) {
    const { userId } = payload;
    const counts = await this.notificationService.calculateUnreadCounts(userId);

    this.notificationService.sendToUser(userId, { data: counts });
  }

  @ApiOperation({
    summary: '重置未读消息数量',
    description: '根据用户 ID 和通知类型重置未读消息的数量。',
  })
  @ApiResponse({ status: 200, description: '成功重置未读消息数量' })
  @OnEvent(SocketEvents.MarkNotificationsAsRead)
  async resetUnreadCount(payload: MarkNotificationsAsReadDto) {
    await this.notificationService.resetUnreadCount(payload);
  }

  @ApiOperation({
    summary: '处理点赞事件',
    description: '当用户点赞时触发事件，通知目标用户内容被点赞。',
  })
  @ApiResponse({ status: 200, description: '成功发送点赞通知' })
  @OnEvent(SocketEvents.UserLikeNotification)
  async handleLike(payload: UserLikeNotificationPayload) {
    await this.notificationService.handleLike(payload);
  }

  @ApiOperation({
    summary: '获取点赞通知列表并清除未读数',
    description: '获取用户的点赞通知列表，同时清除未读状态。',
  })
  @ApiResponse({ status: 200, description: '成功获取点赞通知列表' })
  @Get('likes')
  @ApiResponseWithDto(LikeNotificationDto, '获取登录用户信息', HttpStatus.OK)
  async getLikeNotifications(
    @Request() req: RequestWithUser,
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<ResponseDto<LikeNotificationDto>> {
    const userId = req.user.id;

    return this.notificationService.getLikeNotifications(userId, paginationQuery);
  }
}
