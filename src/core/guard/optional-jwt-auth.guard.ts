import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import { JwtPayload } from '@/common/types';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  /**
   * canActivate 方法用于决定是否激活守卫
   * @param context 执行上下文 ExecutionContext
   * @returns boolean | Promise<boolean> | Observable<boolean> 返回一个布尔值，决定是否允许请求通过
   */
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    // 获取当前请求对象
    const request = context.switchToHttp().getRequest();

    // 获取请求头中的 Authorization 头部信息
    const authHeader: string | undefined = request.headers.authorization;

    // 如果 Authorization 头不存在，则允许请求通过，而不进行 JWT 验证
    if (!authHeader) {
      return true; // 这里返回 true，表示允许请求继续进行
    }

    // 如果存在 Authorization 头，则使用父类的 JWT 守卫来执行验证
    return super.canActivate(context); // 调用父类的 canActivate 方法进行验证
  }

  /**
   * handleRequest 方法用于处理认证后的请求
   * @param err 错误信息
   * @param user 用户对象（经过验证后）
   * @param info 其他信息
   * @returns any 用户对象或者 null，取决于是否通过认证
   */
  handleRequest(err: any, user: JwtPayload): any {
    // 如果出现错误或者没有用户信息
    if (err || !user) {
      // 不抛出异常，返回 null，表示用户未认证
      return null;
    }

    // 如果认证成功，返回用户对象
    return user;
  }
}
