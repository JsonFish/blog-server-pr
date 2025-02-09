import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { CreateRootCommentDto, CreateReplyCommentDto } from './dto/comment.dto';

import { PrismaService } from '@/common/prisma/prisma.service';
import { ResponseDto } from '@/common/dto/response.dto';
import { SocketEvents } from '@/common/enum/event';
import { CommentSortType, SortablePaginationDto } from '@/common/dto/query.dto';
import { generateShortId } from '@/utils';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /**
   * 创建根评论
   */
  async createRootComment(
    data: CreateRootCommentDto,
    userId: string,
    articleId: string,
  ): Promise<ResponseDto<void>> {
    try {
      // 验证文章是否存在
      const articleExists = await this.prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true },
      });

      if (!articleExists) {
        throw new NotFoundException('文章不存���，无法创建评论');
      }

      // 验证评论内容是否为空
      if (!data.content || data.content.trim() === '') {
        throw new BadRequestException('评论内容不能为空');
      }

      // 创建根评论
      const newComment = await this.prisma.articleComment.create({
        data: {
          id: generateShortId(),
          content: data.content,
          image_urls: data.image_urls ? JSON.stringify(data.image_urls) : null, // 序列化图片 URL
          user_id: userId,
          article_id: articleId,
          parent_id: null, // 根评论没有父评论
          root_id: null, // 根评论没有根 ID
          type: 0, // 评论类型，0 表示普通评论
          depth: 0, // 根评论深度为 0
        },
      });

      // 触发事件通知（如 WebSocket 推送）
      this.eventEmitter.emit(SocketEvents.CommentNotification, {
        commentId: newComment.id,
        articleId,
        userId,
      });

      return { data: null, message: '根评论创建成功' };
    } catch (error) {
      // 捕获错误并抛出自定义错误信息
      console.error('创建根评论时发生错误:', error);
      throw new InternalServerErrorException('创建根评论失败，请稍后重试');
    }
  }

  /**
   * 创建回复评论
   */
  async createReplyComment(
    data: CreateReplyCommentDto,
    authorId: string,
    articleId: string,
  ): Promise<ResponseDto<void>> {
    try {
      const { parent_id, root_id } = data;

      const parentComment = await this.prisma.articleComment.findUnique({
        where: { id: parent_id },
      });

      if (!parentComment) {
        throw new NotFoundException('父评论不存在');
      }

      if (parentComment.root_id && parentComment.root_id !== root_id) {
        throw new BadRequestException('根评论 ID 与父评论的根评论 ID 不一致');
      }

      const depth = parentComment.depth + 1;

      const newReply = await this.prisma.articleComment.create({
        data: {
          id: generateShortId(),
          content: data.content,
          image_urls: data.image_urls ? JSON.stringify(data.image_urls) : null,
          user_id: authorId,
          article_id: articleId,
          parent_id,
          root_id,
          type: 1,
          depth,
        },
      });

      this.eventEmitter.emit(SocketEvents.CommentNotification, {
        commentId: newReply.id,
        articleId,
        authorId,
        parentId: parent_id,
        rootId: root_id,
      });

      return { data: null, message: '回复评论创建成功' };
    } catch (error) {
      this.handleError(error, '创建回复评论失败');
    }
  }

  /**
   * 获取根评论（包含前两条回复）
   */
  async getRootCommentsWithReplies(
    articleId: string,
    userId: string,
    query: SortablePaginationDto,
  ): Promise<ResponseDto<any>> {
    const { page, limit, sort = CommentSortType.LATEST } = query;

    try {
      const skip = (page - 1) * limit;

      // 查询根评论时就进行排序
      const rootComments = await this.prisma.articleComment.findMany({
        where: {
          article_id: articleId,
          parent_id: null,
          is_deleted: false,
        },
        skip,
        take: limit,
        orderBy:
          sort === CommentSortType.LATEST
            ? { created_at: 'desc' } // 按最新排序
            : undefined, // 按热度排序时先不排序
        select: {
          id: true,
          content: true,
          created_at: true,
          user_id: true,
          image_urls: true,
          is_pinned: true,
        },
      });

      // 查询根评论总数
      const totalRootComments = await this.prisma.articleComment.count({
        where: { article_id: articleId, parent_id: null, is_deleted: false },
      });

      // 查询每条根评论的前两条子评论
      const rootCommentIds = rootComments.map((comment) => comment.id);

      const replies = await this.prisma.articleComment.findMany({
        where: {
          parent_id: { in: rootCommentIds },
          is_deleted: false,
        },
        orderBy: { created_at: 'asc' },
        take: 2 * rootCommentIds.length, // 每个根评论取2条回复
        select: {
          id: true,
          content: true,
          created_at: true,
          user_id: true,
          parent_id: true,
        },
      });

      // 查询点赞信息（根评论和子评论）
      const commentIds = [...rootCommentIds, ...replies.map((reply) => reply.id)];
      const likeCounts = await this.prisma.commentLike.groupBy({
        by: ['comment_id'],
        _count: { id: true },
        where: { comment_id: { in: commentIds }, is_active: true },
      });

      const userLikes = await this.prisma.commentLike.findMany({
        where: { comment_id: { in: commentIds }, user_id: userId, is_active: true },
        select: { comment_id: true },
      });

      const likeCountsMap = likeCounts.reduce(
        (acc, like) => {
          acc[like.comment_id] = like._count.id;

          return acc;
        },
        {} as Record<number, number>,
      );

      const userLikesMap = userLikes.reduce(
        (acc, like) => {
          acc[like.comment_id] = true;

          return acc;
        },
        {} as Record<number, boolean>,
      );

      // 将子评论按 parent_id 分组并添加点赞信息，同时限制每组最多2条回复
      const groupedReplies = replies.reduce(
        (acc, reply) => {
          if (!acc[reply.parent_id]) {
            acc[reply.parent_id] = [];
          }

          // 只有当该父评论的回复数小于2时才添加
          if (acc[reply.parent_id].length < 2) {
            acc[reply.parent_id].push({
              ...reply,
              like_count: likeCountsMap[reply.id] || 0,
              is_liked: !!userLikesMap[reply.id],
            });
          }

          return acc;
        },
        {} as Record<number, any[]>,
      );

      // 格式化根评论数据
      const formattedComments = await Promise.all(
        rootComments.map(async (comment) => {
          const repliesForComment = groupedReplies[comment.id] || [];

          // 获取该根评论的实际回复总数
          const totalReplies = await this.prisma.articleComment.count({
            where: {
              parent_id: comment.id,
              is_deleted: false,
              depth: 1,
            },
          });

          const likeCount = likeCountsMap[comment.id] || 0;

          return {
            id: comment.id,
            content: comment.content,
            created_at: comment.created_at,
            user_id: comment.user_id,
            image_urls: comment.image_urls,
            is_pinned: comment.is_pinned,
            replies: repliesForComment,
            total_replies: totalReplies,
            remaining_replies: totalReplies - repliesForComment.length,
            has_more_replies: totalReplies > repliesForComment.length,
            like_count: likeCount,
            popularity: likeCount + totalReplies,
            is_liked: !!userLikesMap[comment.id],
          };
        }),
      );

      // 更新排序逻辑
      if (sort === CommentSortType.POPULAR) {
        formattedComments.sort((a, b) => {
          // 优先按置顶排序
          if (a.is_pinned !== b.is_pinned) {
            return a.is_pinned ? -1 : 1;
          }

          // 然后按热度排序
          if (b.popularity !== a.popularity) {
            return b.popularity - a.popularity;
          }

          // 热度相同时按时间降序
          return b.created_at.getTime() - a.created_at.getTime();
        });
      } else {
        // 按最新排序时，只需要处理置顶逻辑
        formattedComments.sort((a, b) => {
          // 优先按置顶排序
          if (a.is_pinned !== b.is_pinned) {
            return a.is_pinned ? -1 : 1;
          }

          // 非置顶的按时间降序
          return b.created_at.getTime() - a.created_at.getTime();
        });
      }

      return {
        data: {
          data: formattedComments,
          total_root_comments: totalRootComments,
          remaining_root_comments: totalRootComments - (skip + rootComments.length),
          has_more_root_comments: totalRootComments > skip + rootComments.length,
        },
        message: '根评论及其前两条回复获取成功',
      };
    } catch (error) {
      this.handleError(error, '获取根评论失败');
    }
  }

  /**
   * 获取根评论的所有子评论（分页）
   */
  async getRepliesForRootComment(
    rootId: string,
    userId: string, // 当前登录用户 ID
    query: SortablePaginationDto,
  ): Promise<ResponseDto<any>> {
    const { page, limit } = query;

    try {
      const initialOffset = 2; // 前两条已经返回
      const skip = initialOffset + (page - 1) * limit;

      // 查询从第三条开始的子评论
      const replies = await this.prisma.articleComment.findMany({
        where: { root_id: rootId, is_deleted: false },
        orderBy: { created_at: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          content: true,
          created_at: true,
          user_id: true,
        },
      });

      // 查询子评论总数
      const totalReplies = await this.prisma.articleComment.count({
        where: { root_id: rootId, is_deleted: false },
      });

      // 查询点赞数量和是否已点赞
      const replyIds = replies.map((reply) => reply.id);

      const likeCounts = await this.prisma.commentLike.groupBy({
        by: ['comment_id'],
        _count: { id: true },
        where: { comment_id: { in: replyIds }, is_active: true },
      });

      const userLikes = await this.prisma.commentLike.findMany({
        where: { comment_id: { in: replyIds }, user_id: userId, is_active: true },
        select: { comment_id: true },
      });

      const likeCountsMap = likeCounts.reduce(
        (acc, like) => {
          acc[like.comment_id] = like._count.id;

          return acc;
        },
        {} as Record<string, number>,
      );

      const userLikesMap = userLikes.reduce(
        (acc, like) => {
          acc[like.comment_id] = true;

          return acc;
        },
        {} as Record<string, boolean>,
      );

      const formattedReplies = replies.map((reply) => ({
        id: reply.id,
        content: reply.content,
        created_at: reply.created_at,
        user_id: reply.user_id,
        like_count: likeCountsMap[reply.id] || 0,
        is_liked: !!userLikesMap[reply.id],
      }));

      return {
        data: {
          data: formattedReplies,
          total_replies: totalReplies,
          remaining_replies: totalReplies - (skip + replies.length),
          has_more_replies: totalReplies > skip + replies.length,
        },
        message: '子评论分页获取成功',
      };
    } catch (error) {
      this.handleError(error, '获取子评论失败');
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any, contextMessage: string): never {
    console.error(`${contextMessage}:`, error);

    if (error instanceof NotFoundException || error instanceof BadRequestException) {
      throw error;
    }

    throw new InternalServerErrorException(`${contextMessage}，请稍后重试`);
  }
}
