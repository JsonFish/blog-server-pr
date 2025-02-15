import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsNumber, IsString, ValidateNested } from 'class-validator';

export class SendVerificationCodeDto {
  @ApiProperty({
    example: '2042204285@qq.com',
    description: 'The email address to send the verification code to',
  })
  @IsNotEmpty({ message: '邮箱地址不能为空' })
  @IsEmail({}, { message: '邮箱地址格式不正确' })
  email: string;
}

export class SendVerificationCodeResponseDto {
  @ApiProperty({ description: '发送状态', example: 'success' })
  @IsString({ message: '状态必须是字符串' })
  status: string;

  @ApiProperty({ description: '验证码有效期，单位为秒', example: 300 })
  @IsNumber({}, { message: '有效期必须是数字' })
  expiresIn: number;
}

export class EmailLoginDto {
  @ApiProperty({ description: 'email账号', example: '2042204285@qq.com' })
  @IsNotEmpty({ message: 'email 不能为空' })
  @IsString({ message: 'email 必须为字符串' })
  @IsEmail({}, { message: 'email 必须是有效的邮箱地址' })
  email: string;

  @ApiProperty({ description: '验证码', example: '123456' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @IsString({ message: '验证码必须为字符串' })
  captcha: string;
}

class UserDto {
  @ApiProperty({ description: '用户 ID', example: '1234567890123456' })
  @IsNotEmpty({ message: '用户 ID 不能为空' })
  @IsString({ message: '用户 ID 必须为字符串' })
  id: string;

  @ApiProperty({ description: '用户名', example: 'john_doe' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @IsString({ message: '用户名必须为字符串' })
  username: string;

  @ApiProperty({
    description: '用户头像 URL',
    example: 'https://example.com/avatar.png',
  })
  @IsString({ message: '用户头像必须为字符串' })
  avatar: string;
}

export class LoginResponseDto {
  @ApiProperty({ description: '访问令牌', example: 'your_access_token' })
  @IsNotEmpty({ message: '访问令牌不能为空' })
  @IsString({ message: '访问令牌必须为字符串' })
  access_token: string;

  @ApiProperty({ description: '刷新令牌', example: 'your_refresh_token' })
  @IsNotEmpty({ message: '刷新令牌不能为空' })
  @IsString({ message: '刷新令牌必须为字符串' })
  refresh_token: string;

  @ApiProperty({ description: '令牌过期时间（秒）', example: 604800 })
  @IsNotEmpty({ message: '令牌过期时间不能为空' })
  @IsNumber({}, { message: '令牌过期时间必须为数字' })
  expiresIn: number;

  @ApiProperty({
    description: '用户信息对象，包含用户基础信息',
    type: UserDto,
  })
  @ValidateNested()
  @Type(() => UserDto)
  user: UserDto;
}
