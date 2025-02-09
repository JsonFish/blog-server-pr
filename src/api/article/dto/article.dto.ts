import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  Length,
  Matches,
  MaxLength,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsBoolean,
  IsUrl,
  IsNotEmpty,
  Min,
  Max,
} from 'class-validator';

export class CreateDraftDto {
  @ApiProperty({
    description:
      '草稿 ID，16 位数字字符串。如果传入，则会更新对应的草稿；如果不传入，则会创建一个新草稿。',
    example: '1234567890123456',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(16, 16, { message: 'ID 必须是 16 位字符' })
  @Matches(/^\d{16}$/, { message: 'ID 必须是 16 位数字' })
  id?: string;

  @ApiProperty({
    description: '文章标题，最大长度为 255 个字符。',
    maxLength: 255,
    example: '未命名草稿',
    default: '未命名草稿',
  })
  @IsString()
  @MaxLength(255, { message: '标题不能超过 255 个字符' })
  @IsOptional()
  title: string = '未命名草稿';

  @ApiProperty({
    description: '文章内容，支持较长的文本格式。',
    example: '草稿内容...',
    default: '',
  })
  @IsString()
  @IsOptional()
  content: string = '';

  @ApiProperty({
    description: '文章分类的 ID。',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: '分类 ID 必须是数字类型' })
  @Min(1, { message: '分类 ID 最小值为 1' })
  @Max(8, { message: '分类 ID 最大值为 8' })
  category_id?: number;

  @ApiProperty({
    description: '文章标签的 ID 列表。',
    example: [1, 2, 3],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: '标签 ID 必须是数组' })
  @ArrayNotEmpty({ message: '标签 ID 列表不能为空' })
  @ArrayUnique({ message: '标签 ID 列表中不能有重复的值' })
  @IsNumber({}, { each: true, message: '每个标签 ID 必须是数字类型' })
  @Min(1, { each: true, message: '标签 ID 最小值为 1' })
  @Max(28, { each: true, message: '标签 ID 最大值为 28' })
  tag_ids?: number[];

  @ApiProperty({
    description: '封面图片的 URL，最大长度为 255 字符。',
    maxLength: 255,
    example: 'https://example.com/default-image.jpg',
    default: '',
  })
  @IsString()
  @MaxLength(255, { message: '封面图片的 URL 不能超过 255 个字符' })
  @IsOptional()
  @IsUrl({}, { message: '封面图片的 URL 格式不正确' })
  cover_image?: string = '';

  @ApiProperty({
    description: '文章摘要，最大长度为 100 个字符。',
    maxLength: 100,
    example: '这是草稿的摘要信息...',
    default: '',
  })
  @IsString()
  @MaxLength(100, { message: '摘要不能超过 100 个字符' })
  @IsOptional()
  summary: string = '';

  @ApiProperty({
    description: '文章激活状态：true 表示激活，false 表示未激活。',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  active_status: boolean = false;

  @ApiProperty({
    description: '文章审核状态：0 表示未审核，1 表示审核完毕，2 表示审核中。',
    example: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: '审核状态必须是数字类型' })
  audit_status: number = 0;
}

export class PublishArticleDto {
  @ApiProperty({
    description: '文章 ID，16 位数字字符串。',
    example: '1234567890123456',
    required: true,
  })
  @IsString()
  @IsNotEmpty({ message: '文章 ID 不能为空' })
  @MaxLength(16, { message: '文章 ID 必须是 16 位字符' })
  id: string;

  @ApiProperty({
    description: '文章标题，最大长度为 255 个字符。',
    example: '我的文章标题',
  })
  @IsString()
  @IsNotEmpty({ message: '标题不能为空' })
  @MaxLength(255, { message: '标题不能超过 255 个字符' })
  title: string;

  @ApiProperty({
    description: '文章内容，支持较长的文本格式。',
    example: '这是文章的内容...',
  })
  @IsString()
  @IsNotEmpty({ message: '内容不能为空' })
  content: string;

  @ApiProperty({
    description: '文章分类的 ID。',
    example: 1,
  })
  @IsNumber({}, { message: '分类 ID 必须是数字类型' })
  @IsNotEmpty({ message: '分类 ID 不能为空' })
  category_id: number;

  @ApiProperty({
    description: '文章标签的 ID 列表。',
    example: [1, 2, 3],
  })
  @IsArray()
  @ArrayNotEmpty({ message: '标签 ID 列表不能为空' })
  @ArrayUnique({ message: '标签 ID 列表中不能有重复的值' })
  @IsNumber({}, { each: true, message: '每个标签 ID 必须是数字类型' })
  tag_ids: number[];

  @ApiProperty({
    description: '封面图片的 URL，最大长度为 255 字符。',
    example: 'https://example.com/default-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: '封面图片的 URL 格式不正确' })
  @MaxLength(255, { message: '封面图片的 URL 不能超过 255 个字符' })
  cover_image?: string;

  @ApiProperty({
    description: '文章摘要，最大长度为 100 个字符。',
    example: '这是文章的摘要信息...',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100, { message: '摘要不能超过 100 个字符' })
  summary?: string;

  @ApiProperty({
    description: '是否公开：true 表示公开，false 表示私密。',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_public: boolean = true;
}

export class UpdateArticleDto {
  @ApiProperty({
    description: '文章标题，最大长度为 255 个字符。更新时提供新的标题。',
    maxLength: 255,
    example: '更新后的文章标题',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255, { message: '标题不能超过 255 个字符' })
  title?: string;

  @ApiProperty({
    description: '文章内容，支持较长的文本格式。更新时提供新的文章内容。',
    example: '更新后的文章内容...',
    required: false,
  })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiProperty({
    description: '文章分类的 ID，用于更新文章分类。',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: '分类 ID 必须是数字类型' })
  category_id?: number;

  @ApiProperty({
    description: '标签字段，用于表示文章的标签列表。可以包含多个标签 ID。',
    example: [1, 2, 3],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty({ message: '标签列表不能为空' })
  @ArrayUnique({ message: '标签列表中的标签 ID 不能重复' })
  @IsNumber({}, { each: true, message: '每个标签 ID 必须是数字类型' })
  tag_ids?: number[];

  @ApiProperty({
    description: '封面图片的 URL，最大长度为 255 字符。可选字段，用于更新文章的封面图片。',
    maxLength: 255,
    example: 'https://example.com/updated-image.jpg',
    required: false,
  })
  @IsString()
  @IsOptional()
  @IsUrl({}, { message: '封面图片的 URL 格式不正确' })
  @MaxLength(255, { message: '封面图片的 URL 不能超过 255 个字符' })
  cover_image?: string;
}
