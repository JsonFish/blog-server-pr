import { Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as nanoid from 'nanoid';
import * as bcrypt from 'bcrypt';

import {
  EmailLoginDto,
  LoginResponseDto,
  SendVerificationCodeDto,
  SendVerificationCodeResponseDto,
} from './dto/auth.dto';

import { ResponseDto } from '@/common/dto/response.dto';
import { PrismaService } from '@/common/prisma/prisma.service';
import { EmailService } from '@/common/email/email.service';
import { RedisService } from '@/common/redis/redis.service';

@Injectable()
export class AuthService {
  private readonly saltRounds = 10;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  /**
   * 发送验证码到指定的邮箱
   * @param data 发送验证码请求的数据
   */
  async sendVerificationCode(
    data: SendVerificationCodeDto,
  ): Promise<ResponseDto<SendVerificationCodeResponseDto>> {
    const { email } = data;
    const verificationCode = nanoid.customAlphabet('1234567890', 6)(); // 生成 6 位数字的验证码

    const expirationDuration = 5 * 60; // 以秒为单位

    try {
      await this.redisService.set(
        `verificationCode:${email}`,
        JSON.stringify({ code: verificationCode, isUsed: false }),
        expirationDuration,
      );

      // 发送验证码邮件
      await this.emailService.sendMail(email, '登录验证码', verificationCode);
    } catch (error) {
      console.error('发送验证码失败:', error);
      throw new InternalServerErrorException('发送验证码失败，请稍后再试。');
    }

    return {
      data: {
        status: 'success',
        expiresIn: expirationDuration, // 返回秒数
      },
      message: '验证码发送成功',
    };
  }

  /**
   * 使用邮箱和验证码登录
   * @param data 登录请求的数据
   */
  async emailLogin(data: EmailLoginDto): Promise<ResponseDto<LoginResponseDto>> {
    const { email, captcha } = data;

    // 验证流程
    const verificationRecord = await this.redisService.get(`verificationCode:${email}`);

    if (!verificationRecord) {
      throw new UnauthorizedException('验证码无效或已过期。');
    }

    const parsedRecord = JSON.parse(verificationRecord);

    // 检查验证码
    if (parsedRecord.code !== captcha) {
      throw new UnauthorizedException('验证码不正确。');
    }

    if (parsedRecord.isUsed) {
      throw new UnauthorizedException('验证码已使用。');
    }

    // 获取验证码的剩余有效时间，并标记为已使用
    const ttl = await this.redisService.getTTL(`verificationCode:${email}`);
    await this.redisService.set(
      `verificationCode:${email}`,
      JSON.stringify({ ...parsedRecord, isUsed: true }),
      ttl,
    );

    // 用户处理：查找或创建用户
    const generateNumericId = nanoid.customAlphabet('1234567890', 16); // 生成 16 位数字 ID
    const hashedPassword = await this.hashPassword(email); // 默认密码（hash）

    const userResult = await this.prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        id: generateNumericId(),
        email,
        username: email.split('@')[0], // 默认用户名
        password: hashedPassword,
        role_id: 2,
        status: true,
        avatar: `https://cdn.pixabay.com/photo/2023/11/04/07/40/cat-8364405_1280.jpg`,
        profile: {
          create: {
            desc: '新用户', // 默认描述
            gender: 0, // 默认性别
            birth: new Date(), // 默认出生日期
            job_title: '未填写', // 默认职位
            company: '', // 默认公司
            location: '', // 默认位置
            website: '', // 默认网站
          },
        },
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true, // 查询头像
      },
    });

    if (!userResult) {
      throw new InternalServerErrorException('用户创建或查找失败');
    }

    // 生成 JWT 令牌
    const tokens = this.generateTokens(userResult.id.toString(), userResult.email);

    // 返回响应
    return {
      data: {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
        expiresIn: 7 * 24 * 60 * 60, // 7 天的有效期
        user: {
          id: userResult.id,
          username: userResult.username,
          avatar: userResult.avatar, // 默认空头像
        },
      },
      message: '登录成功',
    };
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds); // 生成盐

    return bcrypt.hash(password, salt);
  }
  /**
   * 生成访问和刷新令牌
   * @param userId 用户ID
   * @param email 用户邮箱
   * @returns 访问令牌和刷新令牌
   */
  private generateTokens(userId: string, email: string) {
    const accessToken = this.jwtService.sign({ sub: userId, email: email }, { expiresIn: '7d' });
    const refreshToken = this.jwtService.sign({ sub: userId, email: email }, { expiresIn: '30d' });

    return { accessToken, refreshToken };
  }
}
