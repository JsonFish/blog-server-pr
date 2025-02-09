import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';

import { PrismaService } from '@/common/prisma/prisma.service';
import { EventEmitterService } from '@/common/event/event-emitter.service';
import { ResponseDto } from '@/common/dto/response.dto';
import { NotificationType } from '@/common/enum/event';

@Injectable()
export class LikeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitterService: EventEmitterService,
  ) {}

  /**
   * 点赞文章
   * @param userId 用户ID
   * @param articleId 文章ID
   */
  async likeArticle(user_id: string, article_id: string): Promise<ResponseDto<void>> {
    // 校验文章是否存在并获取作者ID
    const article = await this.prisma.article.findUnique({
      where: { id: article_id },
      select: { author_id: true },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 作者可能不存在，不强制报错
    const recipientId = article.author_id || null;

    // 使用事务创建点赞记录
    await this.prisma.$transaction(async (transaction) => {
      const existingLike = await transaction.articleLike.findFirst({
        where: { user_id, article_id, is_active: true },
      });

      if (existingLike) {
        throw new BadRequestException('用户已点赞该文章');
      }

      await transaction.articleLike.upsert({
        where: { user_id_article_id: { user_id, article_id } },
        create: {
          user_id,
          article_id,
          is_active: true,
        },
        update: {
          is_active: true,
          updated_at: new Date(),
        },
      });
    });

    // 仅当 recipientId 存在时发送通知
    if (recipientId) {
      this.eventEmitterService.emitUserLikeNotification({
        senderId: user_id,
        contentId: article_id,
        type: NotificationType.ARTICLE_LIKE,
        recipientId,
      });
    }

    return;
  }

  /**
   * 点赞评论
   * @param userId 用户ID
   * @param commentId 评论ID
   */
  async likeComment(user_id: string, commentId: string): Promise<void> {
    // 校验评论是否存在并获取作者ID
    const comment = await this.prisma.articleComment.findUnique({
      where: { id: commentId },
      select: { user_id: true }, // 查询作者ID
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 作者可能不存在，不强制报错
    const recipientId = comment.user_id || null;

    // 使用事务创建点赞记录
    await this.prisma.$transaction(async (transaction) => {
      const existingLike = await transaction.commentLike.findFirst({
        where: { user_id, comment_id: commentId, is_active: true },
      });

      if (existingLike) {
        throw new BadRequestException('用户已点赞该评论');
      }

      await transaction.commentLike.upsert({
        where: {
          user_id_comment_id: {
            user_id,
            comment_id: commentId,
          },
        },
        create: {
          user_id,
          comment_id: commentId,
          is_active: true,
        },
        update: {
          is_active: true,
          updated_at: new Date(),
        },
      });
    });

    // 仅当 recipientId 存在时发送通知
    if (recipientId) {
      this.eventEmitterService.emitUserLikeNotification({
        senderId: user_id,
        contentId: commentId,
        type: NotificationType.COMMENT_LIKE,
        recipientId,
      });
    }

    return;
  }

  /**
   * 取消点赞文章
   * @param userId 用户ID
   * @param articleId 文章ID
   */
  async unlikeArticle(user_id: string, article_id: string): Promise<void> {
    // 校验文章是否存在
    const article = await this.prisma.article.findUnique({
      where: { id: article_id },
    });

    if (!article) {
      throw new NotFoundException('文章不存在');
    }

    // 使用事务取消点赞
    await this.prisma.$transaction(async (transaction) => {
      const existingLike = await transaction.articleLike.findFirst({
        where: { user_id, article_id, is_active: true },
      });

      if (!existingLike) {
        throw new NotFoundException('未找到文章点赞记录');
      }

      await transaction.articleLike.updateMany({
        where: { user_id, article_id, is_active: true },
        data: { is_active: false, updated_at: new Date() },
      });
    });
  }

  /**
   * 取消点赞评论
   * @param userId 用户ID
   * @param comment_id 评论ID
   */
  async unlikeComment(user_id: string, comment_id: string): Promise<void> {
    // 校验评论是否存在
    const comment = await this.prisma.articleComment.findUnique({
      where: { id: comment_id },
    });

    if (!comment) {
      throw new NotFoundException('评论不存在');
    }

    // 使用事务取消点赞
    await this.prisma.$transaction(async (transaction) => {
      const existingLike = await transaction.commentLike.findFirst({
        where: { user_id, comment_id, is_active: true },
      });

      if (!existingLike) {
        throw new NotFoundException('未找到评论点赞记录');
      }

      await transaction.commentLike.updateMany({
        where: { user_id, comment_id, is_active: true },
        data: { is_active: false, updated_at: new Date() },
      });
    });
  }
}
