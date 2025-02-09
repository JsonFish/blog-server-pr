import {
  Controller,
  Post,
  Body,
  Param,
  Request,
  Get,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { CreateRootCommentDto, CreateReplyCommentDto } from './dto/comment.dto';
import { CommentService } from './comment.service';

import { ResponseDto } from '@/common/dto/response.dto';
import { RequestWithUser } from '@/common/types';
import { OptionalJwtAuthGuard } from '@/core/guard/optional-jwt-auth.guard';
import { SortablePaginationDto } from '@/common/dto/query.dto';

@ApiTags('Comments')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 发布根评论
   */
  @Post(':article_id/root')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '发布根评论', description: '在文章下发布根评论' })
  async postRootComment(
    @Param('article_id') article_id: string,
    @Body() data: CreateRootCommentDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<void>> {
    return await this.commentService.createRootComment(data, req.user.id, article_id);
  }

  /**
   * 发布回复评论
   */
  @Post(':article_id/reply')
  @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: '发布回复评论', description: '在评论下发布回复' })
  async postReplyComment(
    @Param('article_id') article_id: string,
    @Body() data: CreateReplyCommentDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<void>> {
    return await this.commentService.createReplyComment(data, req.user.id, article_id);
  }

  /**
   * 获取根评论（包含前两条回复）
   */
  @Get(':article_id/root')
  @UseGuards(OptionalJwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取根评论',
    description: '分页获取指定文章下的根评论，每条根评论包含最多前两条回复',
  })
  @ApiQuery({ name: 'page', required: false, description: '当前页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 10 })
  async getRootCommentsWithReplies(
    @Param('article_id') article_id: string,
    @Query() query: SortablePaginationDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<any>> {
    const userId = req.user?.id;

    return await this.commentService.getRootCommentsWithReplies(article_id, userId, query);
  }

  /**
   * 获取根评论的所有回复（分页）
   */
  @Get(':root_id/replies')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '获取根评论的所有回复',
    description: '分页获取指定根评论的所有回复',
  })
  @ApiQuery({ name: 'page', required: false, description: '当前页码', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: '每页数量', example: 5 })
  async getRepliesForRootComment(
    @Param('root_id') root_id: string,
    @Query() query: SortablePaginationDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<any>> {
    const userId = req.user?.id;

    return await this.commentService.getRepliesForRootComment(root_id, userId, query);
  }
}
