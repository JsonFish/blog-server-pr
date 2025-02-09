import { IsString, Matches } from 'class-validator';

export class LikeParamDto {
  @IsString()
  @Matches(/^\d{16}$/, { message: 'ID 必须是 16 位纯数字字符串' })
  id: string;
}
