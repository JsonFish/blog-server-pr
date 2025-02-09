import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './auth.strategy';

import { EmailModule } from '@/common/email/email.module';
import { PrismaModule } from '@/common/prisma/prisma.module';
import { JwtConfigEnum } from '@/common/enum/config.enum';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  imports: [
    EmailModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>(JwtConfigEnum.JWT_SECRET),
        signOptions: {
          expiresIn: '77d',
        },
      }),
    }),
    PrismaModule,
  ],
})
export class AuthModule {}
