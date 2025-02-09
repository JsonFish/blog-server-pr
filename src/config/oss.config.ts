import { ConfigService } from '@nestjs/config';

import { OSSConfigEnum } from '../common/enum/config.enum';

export const ossConfig = (configService: ConfigService) => ({
  accessKeyId: configService.get<string>(OSSConfigEnum.OSS_ACCESS_KEY_ID),
  accessKeySecret: configService.get<string>(OSSConfigEnum.OSS_ACCESS_KEY_SECRET),
  bucket: configService.get<string>(OSSConfigEnum.OSS_BUCKET),
  region: configService.get<string>(OSSConfigEnum.OSS_REGION),
});
