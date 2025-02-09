import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessageEvent } from '@nestjs/common';
import { Subject } from 'rxjs';

import { BaseLikeNotificationDto, LikeNotificationDto, PaginationQueryDto } from './dto/index,dto';

import { PrismaService } from '@/common/prisma/prisma.service';
import { NotificationType } from '@/common/enum/event';
import { EventEmitterService } from '@/common/event/event-emitter.service';
import { ResponseDto } from '@/common/dto/response.dto';
import { MarkNotificationsAsReadDto, UserLikeNotificationPayload } from '@/common/dto/event.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  private clients: Map<string, Subject<MessageEvent>> = new Map();

  /**
   * 向特定用户推送消息
   * @param userId 用户ID
   * @param data 要推送的数据
   */
  sendToUser(userId: string, data: MessageEvent) {
    const client = this.clients.get(userId);

    if (client) {
      client.next(data);
    }
  }

  /**
   * 获取未读通知和消息的数量
   * @param userId 用户ID
   * @returns 未读通知和消息的数量统计
   */
  async calculateUnreadCounts(userId: string) {
    const unreadNotifications = await this.prisma.notification.findMany({
      where: { recipientId: userId, isRead: false },
      select: { type: true },
    });

    const counts = unreadNotifications.reduce(
      (acc, notification) => {
        switch (notification.type) {
          case 'ARTICLE_COMMENT':
          case 'COMMENT_COMMENT': // 评论未读，包括文章评论和评论的回复
            acc.commentUnreadCount += 1;
            break;
          case 'ARTICLE_LIKE':
          case 'COMMENT_LIKE':
          case 'ARTICLE_FAVORITE': // 点赞和收藏未读数
            acc.likeFavoriteUnreadCount += 1;
            break;
          case 'FOLLOW': // 关注
            acc.followUnreadCount += 1;
            break;
          case 'OFFICIAL':
          case 'SYSTEM': // 官方通知和系统通知归为官方通知
            acc.officialUnreadCount += 1;
            break;
        }

        return acc;
      },
      {
        commentUnreadCount: 0,
        likeFavoriteUnreadCount: 0, // 点赞和收藏未读数
        followUnreadCount: 0,
        officialUnreadCount: 0, // 官方通知未读数
      },
    );

    const messageUnreadCount = await this.prisma.chatUser.count({
      where: { userId, unreadCount: { gt: 0 } },
    });

    return {
      ...counts,
      messageUnreadCount,
      totalUnreadCount:
        counts.commentUnreadCount +
        counts.likeFavoriteUnreadCount +
        counts.followUnreadCount +
        counts.officialUnreadCount +
        messageUnreadCount,
    };
  }

  /**
   * 重置未读消息数量
   * @param userId 用户ID
   * @param type 通知类型
   */
  async resetUnreadCount(data: MarkNotificationsAsReadDto) {
    const { recipientId, type } = data;
    await this.prisma.notification.updateMany({
      where: {
        recipientId,
        type: {
          in: type,
        },
        isRead: false,
      },
      data: { isRead: true, readAt: new Date() },
    });
  }

  /**
   * 创建通知
   * @param userId 目标用户ID
   * @param senderId 发送者ID
   * @param type 通知类型
   * @param contentId 内容ID
   */
  async createNotification(data: UserLikeNotificationPayload) {
    const { recipientId, senderId, type, contentId, title } = data;

    // 校验 recipientId 和 senderId 是否存在
    const [recipientExists, senderExists] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: recipientId } }),
      this.prisma.user.findUnique({ where: { id: senderId } }),
    ]);

    if (!recipientExists) {
      throw new NotFoundException(`Recipient with ID ${recipientId} does not exist.`);
    }

    if (!senderExists) {
      throw new NotFoundException(`Sender with ID ${senderId} does not exist.`);
    }

    // 防止创建对自己的通知
    if (recipientId === senderId) {
      throw new BadRequestException('Cannot create a notification for yourself.');
    }

    // 防止重复通知
    const existingNotification = await this.prisma.notification.findFirst({
      where: {
        recipientId,
        senderId,
        type,
        contentId,
      },
    });

    if (existingNotification) {
      throw new ConflictException('Notification already exists, skipping creation.');
    }

    // 创建通知
    await this.prisma.notification.create({
      data: {
        recipientId,
        senderId,
        type,
        contentId,
        title,
      },
    });
  }

  /**
   * 处理点赞事件并发送通知
   * @param payload 包含目标用户ID、发送者ID和内容ID的对象
   */
  async handleLike(payload: UserLikeNotificationPayload) {
    await this.createNotification(payload);

    this.sendToUser(payload.recipientId, {
      data: { message: `用户 ${payload.senderId}` },
    });
  }

  async getLikeNotifications(
    userId: string,
    data: PaginationQueryDto,
  ): Promise<ResponseDto<LikeNotificationDto>> {
    const { page, pageSize } = data;

    const notificationTypes: NotificationType[] = [
      NotificationType.ARTICLE_LIKE,
      NotificationType.COMMENT_LIKE,
      NotificationType.ARTICLE_FAVORITE,
    ];

    // 查询所有相关的通知及发送者
    const notifications = await this.prisma.notification.findMany({
      where: {
        recipientId: userId,
        type: { in: notificationTypes },
      },
      select: {
        id: true,
        senderId: true,
        contentId: true,
        type: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // 提取 senderId 和 contentId
    const senderIds = [...new Set(notifications.map((n) => n.senderId))];

    const articleContentIds = [
      ...new Set(
        notifications
          .filter(
            (n) =>
              n.type === NotificationType.ARTICLE_LIKE ||
              n.type === NotificationType.ARTICLE_FAVORITE,
          )
          .map((n) => n.contentId),
      ),
    ];
    const commentContentIds = [
      ...new Set(
        notifications
          .filter((n) => n.type === NotificationType.COMMENT_LIKE)
          .map((n) => n.contentId),
      ),
    ];

    // 批量查询用户信息并缓存
    const users = await this.prisma.user.findMany({
      where: { id: { in: senderIds } },
      select: {
        id: true,
        username: true,
        avatar: true,
      },
    });

    const userMap = new Map(users.map((user) => [user.id, user]));

    // 批量查询文章信息
    const articles = await this.prisma.article.findMany({
      where: { id: { in: articleContentIds } },
      select: {
        id: true,
        title: true,
        cover_image: true,
      },
    });
    const articleMap = new Map(articles.map((article) => [article.id, article]));

    // 批量查询评论信息
    const comments = await this.prisma.articleComment.findMany({
      where: { id: { in: commentContentIds } },
      select: {
        id: true,
        content: true,
      },
    });
    const commentMap = new Map(comments.map((comment) => [comment.id, comment]));

    // 组装通知数据
    const detailedNotifications = notifications
      .map((notification) => {
        const sender = userMap.get(notification.senderId);
        if (!sender) return null; // 过滤无效的 senderId

        let content = null;

        if (
          notification.type === NotificationType.ARTICLE_LIKE ||
          notification.type === NotificationType.ARTICLE_FAVORITE
        ) {
          content = articleMap.get(notification.contentId) || null;
        } else if (notification.type === NotificationType.COMMENT_LIKE) {
          content = commentMap.get(notification.contentId) || null;
        }

        return {
          id: notification.id,
          type: notification.type,
          createdAt: notification.createdAt,
          sender: {
            id: sender.id,
            nickname: sender.username,
            avatar: sender.avatar,
          },
          content,
        };
      })
      .filter((notification) => notification !== null); // 过滤无效通知

    this.eventEmitterService.emitMarkNotificationsAsRead({
      recipientId: userId,
      type: [NotificationType.COMMENT_LIKE, NotificationType.ARTICLE_LIKE],
    });

    // 获取总记录数
    const totalCount = await this.prisma.notification.count({
      where: {
        recipientId: userId,
        type: { in: notificationTypes },
        senderId: { in: senderIds }, // 过滤有效的 senderId
      },
    });

    // 返回分页数据和元信息
    return {
      data: {
        data: detailedNotifications as unknown as BaseLikeNotificationDto[],
        totalCount,
        page,
        pageSize,
        totalPages: Math.ceil(totalCount / pageSize),
      },
    };
  }
}
