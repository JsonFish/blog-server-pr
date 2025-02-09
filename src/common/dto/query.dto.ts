import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * 基础分页 DTO
 */
export class BasePaginationDto {
  @ApiProperty({
    description: '页码（从1开始）',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number) // 类型转换
  @IsInt({ message: '页码必须是整数' })
  @Min(1, { message: '页码必须大于等于 1' })
  page: number = 1;

  @ApiProperty({
    description: '每页的记录数，必须在 1 到 100 之间',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number) // 类型转换
  @IsInt({ message: '每页记录数必须是整数' })
  @Min(1, { message: '每页记录数必须大于等于 1' })
  @Max(100, { message: '每页记录数不能超过 100' })
  limit: number = 10;
}

/**
 * 排序方式枚举
 */
export enum CommentSortType {
  LATEST = 'latest', // 按最新
  POPULAR = 'popular', // 按热度
}

/**
 * 可排序的分页 DTO
 */
export class SortablePaginationDto extends BasePaginationDto {
  @ApiProperty({
    description: '排序方式（latest: 按最新, popular: 按热度）',
    enum: CommentSortType,
    example: 'latest',
    required: false,
    default: 'latest',
  })
  @IsOptional()
  @IsEnum(CommentSortType, {
    message: '排序方式只能是 latest 或 popular',
  })
  sort = 'latest' as CommentSortType;
}
