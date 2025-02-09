import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';

import { PrismaService } from '@/common/prisma/prisma.service';
import { JwtPayload } from '@/common/types';
import { JwtConfigEnum } from '@/common/enum/config.enum';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>(JwtConfigEnum.JWT_SECRET),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtPayload> {
    const { id, email } = payload;

    try {
      const user: User | null = await this.prisma.user.findUnique({
        where: { id, email },
      });

      if (!user) {
        throw new HttpException('未登录或该用户不存在！请前往登录/注册~', HttpStatus.UNAUTHORIZED);
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
      };
    } catch (error) {
      console.error('JWT 验证失败:', error);
      throw new HttpException('Token 验证失败，请重新登录！', HttpStatus.UNAUTHORIZED);
    }
  }
}
