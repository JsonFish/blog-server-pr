import {
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, MulterFile } from '@webundsoehne/nest-fastify-file-upload';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { UploadService } from './upload.service';
import { FileUploadResponseDto } from './dto/index.dto';

import { ResponseDto } from '@/common/dto/response.dto';
import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';

@Controller('upload')
@ApiTags('Upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, callback) => {
        const allowedImageTypes = [
          'image/jpeg',
          'image/png',
          'image/gif',
          'image/webp',
          'image/bmp',
          'image/tiff',
          'image/svg+xml',
        ];

        if (allowedImageTypes.includes(file.mimetype)) {
          callback(null, true);
        } else {
          callback(new HttpException('仅支持上传图片格式的文件', HttpStatus.BAD_REQUEST), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  @ApiOperation({ summary: '上传头像图片' })
  @ApiResponseWithDto(FileUploadResponseDto, '图片上传成功', HttpStatus.OK)
  @HttpCode(HttpStatus.CREATED)
  async convertImage(
    @UploadedFile() file: MulterFile,
  ): Promise<ResponseDto<FileUploadResponseDto>> {
    return await this.uploadService.uploadAvatar(file);
  }
}
