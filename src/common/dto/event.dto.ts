import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsArray, ArrayNotEmpty, IsOptional } from 'class-validator';

import { NotificationType } from '../enum/event';

export class UserLikeNotificationPayload {
  @ApiProperty({
    description: '接收通知的用户ID',
    type: String,
    example: '1234567890123456',
  })
  @IsString()
  recipientId: string;

  @ApiProperty({
    description: '触发通知的用户ID',
    type: String,
    example: '6543210987654321',
  })
  @IsString()
  senderId: string;

  @ApiProperty({
    description: '通知类型',
    enum: NotificationType,
    example: NotificationType.ARTICLE_LIKE,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    description: '关联内容的ID',
    type: String,
    example: 'article123',
  })
  @IsString()
  contentId: string;

  @ApiProperty({
    description: '消息通知标题',
    type: String,
    example: 'article123',
  })
  @IsOptional()
  @IsString()
  title?: string;
}

export class MarkNotificationsAsReadDto {
  @ApiProperty({
    description: '接收通知的用户ID',
    type: String,
    example: '1234567890123456',
  })
  @IsString()
  recipientId: string;

  @ApiProperty({
    description: '通知类型数组',
    type: [String], // 声明是数组
    enum: NotificationType, // 枚举类型
    isArray: true, // 明确指定为数组
    example: [NotificationType.ARTICLE_LIKE, NotificationType.COMMENT_LIKE],
  })
  @IsArray() // 确保是数组
  @ArrayNotEmpty() // 确保数组非空
  @IsEnum(NotificationType, { each: true }) // 确保数组每个元素是 NotificationType
  type: NotificationType[];
}
