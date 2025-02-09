import { Logger, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';

import { TimeoutInterceptor } from './core/interceptor/timeout.interceptor';
import { AllExceptionFilter } from './core/filter/all-exception.filter';
import { TransformInterceptor } from './core/interceptor/transform.interceptor';
import { LogsModule } from './common/logs/logs.module';
import { RedisModule } from './common/redis/redis.module';
import { UserModule } from './api/user/user.module';
import { AuthModule } from './api/auth/auth.module';
import { ArticleModule } from './api/article/article.module';
import { CommentModule } from './api/comment/comment.module';
import { SocketModule } from './api/socket/socket.module';
import { LikeModule } from './api/like/like.module';
import { SseModule } from './api/notification/notification.module';
import { UploadModule } from './api/upload/upload.module';

const NODE_ENV = process.env.NODE_ENV === 'development' ? 'development' : 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${NODE_ENV}`,
    }),
    LogsModule,
    RedisModule,
    UserModule,
    AuthModule,
    ArticleModule,
    CommentModule,
    SocketModule,
    LikeModule,
    SseModule,
    UploadModule,
  ],
  controllers: [],
  providers: [
    Logger,
    {
      provide: APP_INTERCEPTOR,
      useClass: TimeoutInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
  exports: [Logger],
})
export class AppModule {}
