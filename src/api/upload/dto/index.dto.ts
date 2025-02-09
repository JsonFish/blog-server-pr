import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FileUploadResponseDto {
  @ApiProperty({
    description: '上传文件的名称',
    example: 'avatar/733fa4b5fd456fdd304e3f3b64c3d1e140b20f2ab21d740f381313b894409a8f.webp',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: '访问上传文件的 URL',
    example: 'http://code-nav-main-oss.oss-cn-shanghai.aliyuncs.com',
  })
  @IsString()
  url: string;
}
