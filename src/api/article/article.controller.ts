import {
  Controller,
  UseGuards,
  Body,
  Param,
  Post,
  Get,
  Patch,
  Delete,
  Request,
  Query,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiParam } from '@nestjs/swagger';

import { ArticleService } from './article.service';
import { CreateDraftDto, PublishArticleDto, UpdateArticleDto } from './dto/article.dto';

import { RequestWithUser } from '@/common/types';
import { ResponseDto } from '@/common/dto/response.dto';
import { OptionalJwtAuthGuard } from '@/core/guard/optional-jwt-auth.guard';
import { BasePaginationDto } from '@/common/dto/query.dto';

@Controller('article')
@ApiTags('Article')
export class ArticleController {
  constructor(private readonly articleService: ArticleService) {}

  /**
   * 创建草稿（保存为草稿状态）
   */
  @Post('draft')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '创建草稿' })
  async createDraft(
    @Body() data: CreateDraftDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<void>> {
    return await this.articleService.createOrUpdateDraft(data, req.user.id);
  }

  /**
   * 发布文章（将草稿改为已发布状态）
   */
  @Patch('publish')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '发布文章，将草稿改为已发布状态' })
  async publishArticle(
    @Body() publishArticleDto: PublishArticleDto,
    @Request() req: RequestWithUser,
  ) {
    const authorId = req.user.id;

    return await this.articleService.publishArticle(publishArticleDto, authorId);
  }

  /**
   * 获取草稿列表
   */
  @Get('drafts')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '获取草稿列表' })
  async getDrafts(
    @Request() req: RequestWithUser,
    @Query() paginationDto: BasePaginationDto, // 使用基础分页 DTO
  ): Promise<ResponseDto<any>> {
    const authorId = req.user.id;

    // 调用 service 获取草稿列表
    return await this.articleService.getDrafts(authorId, paginationDto);
  }

  /**
   * 删除草稿
   */
  @Delete(':id/draft')
  @UseGuards(AuthGuard('jwt'))
  async deleteDraft(@Param('id') id: string, @Request() req: RequestWithUser) {
    const authorId = req.user.id;

    return await this.articleService.deleteDraft(id, authorId);
  }

  /**
   * 查看文章
   */
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取文章详情' })
  @ApiParam({ name: 'id', description: '文章的唯一标识符', required: true })
  @Get(':id')
  async getArticle(@Request() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user?.id; // 判断用户是否登录

    return await this.articleService.getArticleWithUserInteraction(id, userId);
  }

  /**
   * 编辑自己的文章
   */
  @Patch(':id/edit')
  @UseGuards(AuthGuard('jwt'))
  async editOwnArticle(
    @Param('id') id: string,
    @Body() updateArticleDto: UpdateArticleDto,
    @Request() req: RequestWithUser,
  ) {
    const authorId = req.user.id;

    return await this.articleService.editOwnArticle(id, updateArticleDto, authorId);
  }

  /**
   * 删除自己的文章
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteOwnArticle(@Param('id') id: string, @Request() req: RequestWithUser) {
    const authorId = req.user.id;

    return await this.articleService.deleteOwnArticle(id, authorId);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取所有分类' })
  async getAllCategories(): Promise<ResponseDto<any>> {
    return await this.articleService.getAllCategories();
  }

  /**
   * 获取所有标签
   */
  @Get('tags')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '获取所有标签' })
  async getAllTags(): Promise<ResponseDto<any>> {
    return await this.articleService.getAllTags();
  }

  /**
   * 会员访问会员专属区域
   */
  @Get('member/only')
  async accessMemberOnlyArea(@Request() req: RequestWithUser) {
    const userId = req.user.id;

    return await this.articleService.accessMemberOnlyArea(userId);
  }
}
