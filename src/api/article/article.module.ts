import { Module } from '@nestjs/common';

import { ArticleService } from './article.service';
import { ArticleController } from './article.controller';

import { PrismaModule } from '@/common/prisma/prisma.module';

@Module({
  controllers: [ArticleController],
  providers: [ArticleService],
  imports: [PrismaModule],
})
export class ArticleModule {}
