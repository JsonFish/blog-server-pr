import { Controller, Patch, Param, Request, Body, UseGuards, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiParam, ApiBody } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { LikeService } from './like.service';
import { LikeParamDto } from './dto/like.dto';

import { ResponseDto } from '@/common/dto/response.dto';
import { RequestWithUser } from '@/common/types';

@Controller('like')
@ApiTags('Like')
@UseGuards(AuthGuard('jwt'))
export class LikeController {
  constructor(private readonly likeService: LikeService) {}

  /**
   * 更新文章点赞状态
   */
  @Patch('article/:id')
  @ApiOperation({ summary: '更新文章点赞状态' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: '文章的唯一标识 ID (16 位数字)',
    example: '1234567890123456',
  })
  @ApiBody({
    description: '更新点赞状态所需的请求体',
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: '是否为点赞状态 (true 表示点赞, false 表示取消点赞)',
          example: true,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '操作成功', type: ResponseDto })
  async updateArticleLike(
    @Request() req: RequestWithUser,
    @Param() params: LikeParamDto,
    @Body('isActive') isActive: boolean,
  ): Promise<ResponseDto<void>> {
    const userId = req.user.id;

    if (isActive) {
      await this.likeService.likeArticle(userId, params.id);
    } else {
      await this.likeService.unlikeArticle(userId, params.id);
    }

    return;
  }

  /**
   * 更新评论点赞状态
   */
  @Patch('comment/:id')
  @ApiOperation({ summary: '更新评论点赞状态' })
  @ApiParam({
    name: 'id',
    type: 'string',
    description: '评论的唯一标识 ID (16 位数字)',
    example: '1234567890123456',
  })
  @ApiBody({
    description: '更新点赞状态所需的请求体',
    schema: {
      type: 'object',
      properties: {
        isActive: {
          type: 'boolean',
          description: '是否为点赞状态 (true 表示点赞, false 表示取消点赞)',
          example: false,
        },
      },
    },
  })
  @ApiResponse({ status: HttpStatus.OK, description: '操作成功', type: ResponseDto })
  async updateCommentLike(
    @Request() req: RequestWithUser,
    @Param() params: LikeParamDto,
    @Body('isActive') isActive: boolean,
  ): Promise<ResponseDto<void>> {
    const userId = req.user.id;

    if (isActive) {
      await this.likeService.likeComment(userId, params.id);
    } else {
      await this.likeService.unlikeComment(userId, params.id);
    }

    return { data: null };
  }
}
