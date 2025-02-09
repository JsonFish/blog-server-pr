import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class BaseLikeNotificationDto {
  @ApiProperty({ description: '通知 ID' })
  id: string;

  @ApiProperty({ description: '通知类型，例如 ARTICLE_LIKE 或 COMMENT_LIKE' })
  type: string;

  @ApiProperty({ description: '通知创建时间' })
  createdAt: Date;

  @ApiProperty({
    description: '发送者信息（点赞用户）',
    example: {
      id: '123456',
      nickname: '用户A',
      avatar: 'https://example.com/avatar.png',
    },
  })
  sender: {
    id: string;
    nickname: string;
    avatar: string;
  };

  @ApiProperty({
    description: '关联内容信息（文章或评论）',
    example: {
      id: '987654',
      title: '文章标题',
      coverImage: 'https://example.com/cover.png',
    },
    nullable: true,
  })
  content: {
    id: string;
    title?: string; // 文章标题
    coverImage?: string; // 文章封面
    content?: string; // 评论内容
  } | null;
}

export class LikeNotificationDto {
  @ApiProperty({
    description: '分页数据列表',
    type: [BaseLikeNotificationDto],
  })
  data: BaseLikeNotificationDto[];

  @ApiProperty({ description: '总记录数' })
  totalCount: number;

  @ApiProperty({ description: '当前页码' })
  page: number;

  @ApiProperty({ description: '每页记录数' })
  pageSize: number;

  @ApiProperty({ description: '总页数' })
  totalPages: number;
}

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: '页码，从 1 开始（默认值为 1）',
    example: 1,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: '每页数据条数（默认值为 10）',
    example: 10,
  })
  @Transform(({ value }) => parseInt(value, 10))
  @IsOptional()
  @IsInt()
  @Min(1)
  pageSize?: number = 20;
}
