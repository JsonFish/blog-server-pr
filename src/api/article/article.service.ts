import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as nanoid from 'nanoid';

import { CreateDraftDto, PublishArticleDto, UpdateArticleDto } from './dto/article.dto';

import { PrismaService } from '@/common/prisma/prisma.service';
import { ResponseDto } from '@/common/dto/response.dto';
import { BasePaginationDto } from '@/common/dto/query.dto';

@Injectable()
export class ArticleService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 创建草稿（保存为草稿状态）
   */
  async createOrUpdateDraft(data: CreateDraftDto, authorId: string): Promise<ResponseDto<void>> {
    const { id, category_id, tag_ids, ...draftData } = data;

    if (id) {
      // 查找草稿是否存在
      const existingDraft = await this.prisma.article.findUnique({
        where: { id },
        select: { is_draft: true }, // 仅选择必要字段
      });

      if (!existingDraft) {
        throw new NotFoundException('草稿不存在，无法更新');
      }

      if (!existingDraft.is_draft) {
        throw new BadRequestException('只能更新草稿，已发布文章无法更新');
      }

      // 更新草稿的分类关联
      const updateData: any = {
        ...draftData,
        updated_at: new Date(),
      };

      if (category_id) {
        updateData.category = { connect: { id: category_id } };
      } else {
        updateData.category = { disconnect: true }; // 如果未提供分类 ID，则解除分类关联
      }

      // 更新草稿的标签关联
      if (tag_ids) {
        await this.prisma.article.update({
          where: { id },
          data: {
            tags: { deleteMany: {} }, // 删除当前所有标签
          },
        });

        updateData.tags = {
          create: tag_ids.map((tag_id) => ({ tag_id })), // 重新创建标签关联
        };
      }

      // 更新草稿
      await this.prisma.article.update({
        where: { id },
        data: updateData,
      });

      return { message: '草稿更新成功' };
    } else {
      // 创建新草稿
      const generateNumericId = nanoid.customAlphabet('1234567890', 16)();

      const createData: any = {
        id: generateNumericId,
        ...draftData,
        is_public: false, // 默认私密
        is_draft: true, // 草稿标识
        audit_status: 0, // 默认未审核
        active_status: false, // 默认未激活
        author_id: authorId, // 作者 ID
      };

      // 添加分类关联
      if (category_id) {
        createData.category = { connect: { id: category_id } };
      }

      // 添加标签关联
      if (tag_ids) {
        createData.tags = {
          create: tag_ids.map((tag_id) => ({ tag_id })),
        };
      }

      await this.prisma.article.create({
        data: createData,
      });

      return { message: '草稿创建成功' };
    }
  }

  /**
   * 发布文章（将草稿改为已发布状态）
   */
  async publishArticle(data: PublishArticleDto, authorId: string): Promise<ResponseDto<any>> {
    const { id, title, content, category_id, tag_ids, cover_image, summary, is_public } = data;

    // 查找文章
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: { author_id: true, is_deleted: true, is_public: true, is_draft: true },
    });

    if (!article || article.is_deleted) {
      throw new NotFoundException('文章不存在或已被删除');
    }

    if (article.author_id !== authorId) {
      throw new ForbiddenException('您无权发布此文章');
    }

    // 检查文章是否已发布
    if (article.is_public) {
      throw new BadRequestException('文章已发布，无法重复发布');
    }

    // 检查文章是否为草稿
    if (!article.is_draft) {
      throw new BadRequestException('只有草稿状态的文章可以发布');
    }

    // 校验分类和标签
    await this.validateCategory(category_id);
    await this.validateTags(tag_ids);

    // 更新文章状态为已发布
    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: {
        title,
        content,
        category: { connect: { id: category_id } }, // 关联分类
        tags: {
          deleteMany: {}, // 清空现有标签
          create: tag_ids.map((tag_id) => ({ tag_id })), // 创建新的标签关联
        },
        cover_image,
        summary,
        is_public: is_public ?? true, // 默认设置为公开
        is_draft: false, // 取消草稿状态
        audit_status: 1, // 默认设置为“待审核”
        published_at: new Date(), // 设置发布时间
      },
      select: { id: true, title: true }, // 仅选择需要的字段返回
    });

    return {
      message: '文章已成功发布',
      data: { id: updatedArticle.id, title: updatedArticle.title },
    };
  }

  /**
   * 获取草稿列表
   */
  async getDrafts(authorId: string, query: BasePaginationDto): Promise<ResponseDto<any>> {
    const { page = 1, limit: pageSize = 10 } = query; // 解构分页参数并设置默认值
    const skip = (page - 1) * pageSize;

    // 构造查询条件
    const whereCondition = {
      author_id: authorId,
      is_draft: true, // 只查询草稿
      is_deleted: false, // 排除已删除的草稿
    };

    // 并行查询草稿数据和总数，优化数据库访问性能
    const [drafts, total] = await Promise.all([
      this.prisma.article.findMany({
        where: whereCondition,
        orderBy: { updated_at: 'desc' }, // 按更新时间降序
        skip,
        take: pageSize,
      }),
      this.prisma.article.count({
        where: whereCondition, // 使用相同的条件查询总数
      }),
    ]);

    // 返回统一响应
    return {
      message: '草稿列表获取成功',
      data: {
        data: drafts, // 草稿列表
        total, // 总记录数
        page, // 当前页码
        pageSize, // 每页记录数
        totalPages: Math.ceil(total / pageSize), // 总页数
      },
    };
  }

  /**
   * 删除草稿
   */
  async deleteDraft(id: string, authorId: string): Promise<ResponseDto<void>> {
    // 查找草稿
    const draft = await this.prisma.article.findUnique({
      where: { id },
      select: { author_id: true, is_draft: true, is_deleted: true },
    });

    if (!draft) {
      throw new NotFoundException('草稿不存在');
    }

    if (draft.is_deleted) {
      throw new NotFoundException('草稿已被删除');
    }

    if (!draft.is_draft) {
      throw new BadRequestException('只能删除草稿，已发布文章无法删除');
    }

    if (draft.author_id !== authorId) {
      throw new ForbiddenException('您无权删除此草稿');
    }

    // 软删除草稿
    await this.prisma.article.update({
      where: { id },
      data: {
        is_deleted: true, // 标记为已删除
        updated_at: new Date(), // 更新更新时间
      },
    });

    return { message: '草稿已成功删除' };
  }

  /**
   * 查看文章
   */
  async getArticleWithUserInteraction(
    id: string,
    userId: string | undefined,
  ): Promise<ResponseDto<any>> {
    // 查询文章，并包含分类和标签信息
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        category: true, // 包含分类信息
        tags: {
          include: { tag: true }, // 包含标签信息
        },
      },
    });

    // 检查文章是否存在或已被删除
    if (!article || article.is_deleted) {
      throw new NotFoundException('文章不存在或已被删除');
    }

    const likeCount = await this.prisma.articleLike.count({
      where: {
        article_id: id,
        is_active: true,
      },
    });

    const commentCount = await this.prisma.articleComment.count({
      where: {
        article_id: id,
        is_deleted: false,
      },
    });

    const CollectionCount = await this.prisma.articleCollection.count({
      where: {
        article_id: id,
        is_deleted: false,
      },
    });

    const isLike = userId
      ? !!(await this.prisma.articleLike.findFirst({
          where: {
            article_id: id,
            user_id: userId,
            is_active: true,
          },
        }))
      : false;

    const isCollection = userId
      ? !!(await this.prisma.articleCollection.findFirst({
          where: {
            article_id: id,
            user_id: userId,
            is_deleted: false,
          },
        }))
      : false;

    // 格式化返回的数据
    const formattedTags = article.tags.map((tag) => ({
      id: tag.tag.id,
      name: tag.tag.name,
    }));

    return {
      message: '文章详情获取成功',
      data: {
        id: article.id,
        title: article.title,
        content: article.content,
        summary: article.summary,
        cover_image: article.cover_image,
        is_public: article.is_public,
        created_at: article.created_at,
        updated_at: article.updated_at,
        category: article.category
          ? {
              id: article.category.id,
              name: article.category.name,
            }
          : null,
        tags: formattedTags,
        like_count: likeCount,
        comment_count: commentCount,
        collection_count: CollectionCount,
        is_like: isLike,
        is_collection: isCollection,
      },
    };
  }

  /**
   * 编辑自己的文章
   */
  async editOwnArticle(
    id: string,
    updateArticleDto: UpdateArticleDto,
    authorId: string,
  ): Promise<ResponseDto<any>> {
    // 查找文章
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: {
        tags: { select: { tag_id: true } }, // 包含当前文章的标签信息
      },
    });

    // 检查文章是否存在或被删除
    if (!article || article.is_deleted) {
      throw new NotFoundException('文章不存在或已被删除');
    }

    // 检查是否为作者本人
    if (article.author_id !== authorId) {
      throw new ForbiddenException('您无权编辑此文章');
    }

    const { category_id, tag_ids, ...otherFields } = updateArticleDto;

    // 检查分类是否存在（如果传入了 category_id）
    if (category_id) {
      const categoryExists = await this.prisma.category.findUnique({
        where: { id: category_id },
      });

      if (!categoryExists) {
        throw new NotFoundException(`分类 ID ${category_id} 不存在`);
      }
    }

    // 处理标签更新（如果传入了 tag_ids）
    let tagUpdates = undefined;

    if (tag_ids && tag_ids.length > 0) {
      // 检查每个标签是否存在
      const tagIds = await Promise.all(
        tag_ids.map(async (tagId) => {
          const tagExists = await this.prisma.tag.findUnique({ where: { id: tagId } });

          if (!tagExists) {
            throw new NotFoundException(`标签 ID ${tagId} 不存在`);
          }

          return tagId;
        }),
      );

      // 准备标签更新数据
      tagUpdates = {
        deleteMany: {}, // 删除当前所有标签
        create: tagIds.map((tagId) => ({
          tag_id: tagId, // 关联新的标签
        })),
      };
    }

    // 更新文章数据
    const updatedArticle = await this.prisma.article.update({
      where: { id },
      data: {
        ...otherFields, // 更新普通字段（如 title, content 等）
        category: category_id ? { connect: { id: category_id } } : undefined, // 更新分类
        tags: tagUpdates, // 更新标签
        updated_at: new Date(), // 更新更新时间
      },
      include: {
        category: true, // 包含分类信息
        tags: { include: { tag: true } }, // 包含更新后的标签信息
      },
    });

    // 格式化返回数据
    const formattedTags = updatedArticle.tags.map((tag) => ({
      id: tag.tag.id,
      name: tag.tag.name,
    }));

    return {
      message: '文章编辑成功',
      data: {
        id: updatedArticle.id,
        title: updatedArticle.title,
        content: updatedArticle.content,
        summary: updatedArticle.summary,
        cover_image: updatedArticle.cover_image,
        category: updatedArticle.category
          ? {
              id: updatedArticle.category.id,
              name: updatedArticle.category.name,
            }
          : null,
        tags: formattedTags,
        updatedAt: updatedArticle.updated_at,
      },
    };
  }

  /**
   * 删除自己的文章
   */
  async deleteOwnArticle(id: string, authorId: string): Promise<ResponseDto<void>> {
    // 查找文章并验证权限
    const article = await this.prisma.article.findUnique({
      where: { id },
      select: {
        is_deleted: true,
        author_id: true,
      },
    });

    // 检查文章是否存在或已被删除
    if (!article || article.is_deleted) {
      throw new NotFoundException('文章不存在或已被删除');
    }

    // 检查是否为作者本人
    if (article.author_id !== authorId) {
      throw new ForbiddenException('您无权删除此文章');
    }

    // 执行软删除操作
    await this.prisma.article.update({
      where: { id },
      data: {
        is_deleted: true, // 标记为已删除
        updated_at: new Date(), // 更新更新时间
      },
    });

    return {
      message: '文章已成功删除',
    };
  }

  async getAllCategories(): Promise<ResponseDto<any>> {
    // 查询所有未删除的分类
    const categories = await this.prisma.category.findMany({
      where: { is_deleted: false }, // 修改为统一命名风格
      select: {
        id: true,
        name: true,
        description: true,
        created_at: true, // 如果需要创建时间
        updated_at: true, // 如果需要更新时间
      },
      orderBy: { created_at: 'asc' }, // 按创建时间排序，方便前端展示
    });

    return {
      message: '分类列表获取成功',
      data: categories,
    };
  }

  async getAllTags(): Promise<ResponseDto<any>> {
    // 查询所有未删除的标签
    const tags = await this.prisma.tag.findMany({
      where: { is_deleted: false }, // 修改为一致的命名风格
      select: {
        id: true,
        name: true,
        created_at: true, // 可选：添加创建时间
        updated_at: true, // 可选：添加更新时间
      },
      orderBy: { created_at: 'asc' }, // 按创建时间排序，便于展示
    });

    return {
      message: '标签列表获取成功',
      data: tags,
    };
  }

  private async validateCategory(categoryId: number) {
    const category = await this.prisma.category.findUnique({ where: { id: categoryId } });

    if (!category) {
      throw new NotFoundException(`分类 ID ${categoryId} 不存在`);
    }
  }

  /**
   * 校验标签是否存在
   */
  private async validateTags(tagIds: number[]) {
    for (const tagId of tagIds) {
      const tag = await this.prisma.tag.findUnique({ where: { id: tagId } });

      if (!tag) {
        throw new NotFoundException(`标签 ID ${tagId} 不存在`);
      }
    }
  }

  /**
   * 会员专属区域逻辑
   */
  async accessMemberOnlyArea(userId: string) {
    console.log(userId);

    // 会员专属逻辑
    return { message: '欢迎访问会员专属区域' };
  }
}
