import { Request } from '@nestjs/common';

export interface ResponseModel<T> {
  code: number;
  message: string;
  data: T;
}

export interface SmsCodeType {
  RequestId: string;
  Code: string;
  BizId: string;
}

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: JwtPayload;
}

export type ObjectType = Record<string, any>;
