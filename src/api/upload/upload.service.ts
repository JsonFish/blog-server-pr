import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { MulterFile } from '@webundsoehne/nest-fastify-file-upload';
import OSS from 'ali-oss';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import * as path from 'path';
import * as crypto from 'crypto';

import { FileUploadResponseDto } from './dto/index.dto';

import { ossConfig } from '@/config/oss.config';
import { ResponseDto } from '@/common/dto/response.dto';

@Injectable()
export class UploadService {
  private client: OSS;

  constructor(private configService: ConfigService) {
    const config = ossConfig(this.configService);
    this.client = new OSS(config);
  }

  async uploadAvatar(file: MulterFile): Promise<ResponseDto<FileUploadResponseDto>> {
    console.log('Received file:', file);

    const fileBuffer = file.buffer;
    const fileExt = path.extname(file.originalname).toLowerCase();

    let finalBuffer = fileBuffer;
    let fileName = '';

    if (fileExt !== '.webp') {
      try {
        console.log('Converting image to WebP format...');
        finalBuffer = await sharp(fileBuffer).webp().toBuffer();
        fileName = this.generateFileHash(finalBuffer);
        fileName += '.webp';
      } catch (error) {
        console.error('Error converting image to WebP:', error);
        throw new InternalServerErrorException('Error converting image to WebP');
      }
    } else {
      fileName = this.generateFileHash(fileBuffer);
      fileName += '.webp';
    }

    const fileExists = await this.checkIfFileExists(fileName);

    if (fileExists) {
      console.log('File already exists on OSS, returning URL.');

      return this.getFileUrl(fileName);
    }

    try {
      await this.client.put(fileName, finalBuffer);
      console.log('File uploaded successfully.');

      return this.getFileUrl(fileName);
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new InternalServerErrorException('Error uploading file to OSS');
    }
  }

  private generateFileHash(fileBuffer: Buffer): string {
    const hash = crypto.createHash('sha256');
    hash.update(fileBuffer);

    return hash.digest('hex');
  }

  private async checkIfFileExists(fileName: string): Promise<boolean> {
    try {
      const result = await this.client.head(fileName);

      return result.status === 200;
    } catch (error) {
      if (error.code === 'NoSuchKey') {
        return false;
      }

      throw new InternalServerErrorException('Error checking if file exists in OSS');
    }
  }

  private getFileUrl(fileName: string): ResponseDto<any> {
    const fileUrl = this.client.signatureUrl(fileName, {
      expires: 60 * 60,
    });

    return {
      data: {
        name: fileName,
        url: fileUrl,
      },
    };
  }
}
