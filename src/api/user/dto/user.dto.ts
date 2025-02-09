import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsNumber,
  IsDateString,
  IsEmail,
  IsPhoneNumber,
  Matches,
} from 'class-validator';

// 性别枚举
export enum Gender {
  MALE = 0,
  FEMALE = 1,
  OTHER = 2,
}

// 通用的用户 ID DTO
export class UserIdDto {
  @ApiProperty({
    example: '1234567890123456', // 示例值
    description: '用户的唯一标识符，必须为 16 位纯数字字符串',
  })
  @Matches(/^\d{16}$/, { message: '用户 ID 必须是 16 位纯数字字符串' }) // 验证格式
  id: string;
}

// 基础的个人资料字段
export class BaseProfileDto {
  @ApiProperty({ example: '个人简介', description: '用户的个人简介' })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: '用户头像 URL',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: 2,
    description: '用户性别，0: MALE, 1: FEMALE, 2: OTHER',
    enum: Gender,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({ example: '1990-01-01T00:00:00Z', description: '用户出生日期' })
  @IsOptional()
  @IsDateString()
  birth?: Date;

  @ApiProperty({ example: '高级开发', description: '用户的职位' })
  @IsOptional()
  @IsString()
  job_title?: string;

  @ApiProperty({ example: 'Tech 公司', description: '用户公司' })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiProperty({ example: '上海市', description: '用户所在位置' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    example: 'https://user-website.com',
    description: '用户个人网站或博客链接',
  })
  @IsOptional()
  @IsString()
  website?: string;
}

// 基础的用户信息字段
export class BaseUserDto extends UserIdDto {
  @ApiProperty({ example: 'user@example.com', description: '用户邮箱' })
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '2042204285', description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({ example: 1, description: '角色 ID' })
  role_id: number;

  @ApiProperty({ example: true, description: '用户是否处于激活状态' })
  status: boolean;

  @ApiProperty({ example: '123-456-7890', description: '用户手机号' })
  @IsOptional()
  @IsString()
  @IsPhoneNumber('CN', { message: '无效的中国手机号码' })
  phone?: string;

  @ApiProperty({ example: '2024-10-22T12:00:00Z', description: '账户创建时间' })
  @IsDateString()
  created_at: Date;

  @ApiProperty({ example: '2024-10-23T12:00:00Z', description: '最近更新时间' })
  @IsDateString()
  updated_at: Date;
}

// 个人资料 DTO
export class ProfileDto extends BaseProfileDto {
  @ApiProperty({ example: 2, description: '个人资料 ID' })
  id: number;

  @ApiProperty({ example: '5657377758596565', description: '关联的用户 ID' })
  user_id: string;

  @ApiProperty({ example: 100, description: '用户积分' })
  @IsNumber()
  points: number;

  @ApiProperty({ example: 99999, description: '用户排名' })
  @IsOptional()
  @IsNumber()
  ranking?: number;
}

// 用户响应 DTO
export class UserResponseDto extends UserIdDto {
  @ApiProperty({ example: '2042204285', description: '用户名' })
  @IsString()
  username: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: '用户头像 URL',
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: false,
    description: '当前用户是否关注该用户',
    required: false,
  })
  @IsOptional()
  is_following?: boolean;

  @ApiProperty({
    example: 100,
    description: '粉丝数量',
    required: false,
  })
  @IsOptional()
  followers_count?: number;

  @ApiProperty({
    example: 50,
    description: '关注数量',
    required: false,
  })
  @IsOptional()
  following_count?: number;
}

// 用户响应转换器，排除敏感字段
export class UserResponseTransformer extends UserResponseDto {
  @Exclude()
  @IsString()
  password: string;
}

export class UpdateUserProfileDto {
  @ApiProperty({ example: 'new_username', description: '用户名' })
  @IsString({ message: '用户名必须是字符串' })
  username: string;

  @ApiProperty({ example: '123-456-7890', description: '手机号' })
  @IsString({ message: '手机号必须是字符串' })
  @IsPhoneNumber('CN', { message: '无效的中国手机号码' })
  phone: string;

  @ApiProperty({ example: '个人简介', description: '用户的个人简介' })
  @IsString({ message: '简介必须是字符串' })
  desc: string;

  @ApiProperty({
    example: 'https://example.com/avatar.png',
    description: '用户头像 URL',
  })
  @IsString({ message: '头像 URL 必须是字符串' })
  avatar: string;

  @ApiProperty({ example: 2, description: '用户性别，0: MALE, 1: FEMALE, 2: OTHER' })
  @IsEnum(Gender, { message: '性别必须是 MALE, FEMALE 或 OTHER' })
  gender: Gender;

  @ApiProperty({ example: '1990-01-01T00:00:00Z', description: '用户出生日期' })
  @IsDateString({}, { message: '出生日期格式无效' })
  birth: Date;

  @ApiProperty({ example: '高级开发', description: '用户的职位' })
  @IsString({ message: '职位必须是字符串' })
  job_title: string;

  @ApiProperty({ example: 'Tech 公司', description: '用户公司' })
  @IsString({ message: '公司名称必须是字符串' })
  company: string;

  @ApiProperty({ example: '上海市', description: '用户所在位置' })
  @IsString({ message: '位置必须是字符串' })
  location: string;

  @ApiProperty({
    example: 'https://user-website.com',
    description: '用户个人网站或博客链接',
  })
  @IsString({ message: '个人网站必须是字符串' })
  website: string;
}
