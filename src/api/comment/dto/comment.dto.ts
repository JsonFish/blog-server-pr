import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, IsArray, ArrayMaxSize, IsOptional, IsUrl } from 'class-validator';

export class ImageUrlsValidator {
  @ApiProperty({
    description: '评论关联的图片 URL 数组，最多包含 3 张图片，每个值必须是合法的 URL',
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  @IsArray({ message: '图片 URL 必须是数组' })
  @ArrayMaxSize(3, { message: '最多只能包含 3 张图片' })
  @IsUrl({}, { each: true, message: '每个图片 URL 必须是合法的 URL' })
  @IsOptional()
  image_urls?: string[];
}

export class CreateRootCommentDto extends ImageUrlsValidator {
  @ApiProperty({
    description: '评论内容',
    example: '这是一个根评论内容',
  })
  @IsString({ message: '评论内容必须是字符串' })
  @MaxLength(1000, { message: '评论内容长度不能超过 1000 个字符' })
  content: string;
}

export class CreateReplyCommentDto extends ImageUrlsValidator {
  @ApiProperty({
    description: '评论内容',
    example: '这是一个回复评论内容',
  })
  @IsString({ message: '评论内容必须是字符串' })
  @MaxLength(1000, { message: '评论内容长度不能超过 1000 个字符' })
  content: string;

  @ApiProperty({
    description: '父评论 ID（直接回复的评论）',
    example: 'comment1234567890',
  })
  @IsString({ message: '父评论 ID 必须是字符串' })
  parent_id: string;

  @ApiProperty({
    description: '根评论 ID（整个评论链的起始评论）',
    example: 'comment0987654321',
  })
  @IsString({ message: '根评论 ID 必须是字符串' })
  root_id: string;
}
