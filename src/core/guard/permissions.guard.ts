import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User } from '@prisma/client';

import { PERMISSIONS_KEY } from '../decorate/permissions.decorator';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';

import { JwtPayload } from '@/common/types';
import { PrismaService } from '@/common/prisma/prisma.service';

// 定义包含角色和权限结构的用户类型
interface UserWithRolesAndPermissions extends User {
  role: {
    name: string;
    permissions: { permission: { name: string } }[];
    parentRoles: {
      parentRole: {
        name: string;
        permissions: { permission: { name: string } }[];
        parentRoles: any[];
      };
    }[];
  } | null;
}

@Injectable()
export class PermissionsGuard extends OptionalJwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isJwtValid = await super.canActivate(context);

    if (!isJwtValid) {
      return false;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true; // 无权限要求，允许访问
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as JwtPayload;

    if (!user) {
      throw new ForbiddenException('用户未认证');
    }

    const userRolesAndPermissions = await this.fetchUserRolesAndPermissions(user.id);

    if (!this.checkSSD(userRolesAndPermissions.roles)) {
      throw new ForbiddenException('用户分配了静态冲突的角色');
    }

    if (!this.checkDSD(userRolesAndPermissions.roles)) {
      throw new ForbiddenException('用户在会话中激活了冲突角色');
    }

    const hasPermission = requiredPermissions.every((permission) =>
      userRolesAndPermissions.permissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('访问被拒绝，权限不足');
    }

    return true;
  }

  private async fetchUserRolesAndPermissions(
    userId: string,
  ): Promise<{ roles: Set<string>; permissions: Set<string> }> {
    const user = (await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
            parentRoles: {
              include: {
                parentRole: {
                  include: {
                    permissions: { include: { permission: true } },
                    parentRoles: true,
                  },
                },
              },
            },
          },
        },
      },
    })) as UserWithRolesAndPermissions | null;

    if (!user || !user.role) {
      throw new ForbiddenException('用户或角色未找到');
    }

    const roles = new Set<string>();
    const permissions = new Set<string>();

    this.collectRolesAndPermissions(user.role, roles, permissions);

    return { roles, permissions };
  }

  private collectRolesAndPermissions(
    role: UserWithRolesAndPermissions['role'],
    roles: Set<string>,
    permissions: Set<string>,
  ): void {
    const stack = [role];

    while (stack.length) {
      const currentRole = stack.pop();
      if (!currentRole || roles.has(currentRole.name)) continue;

      roles.add(currentRole.name);

      currentRole.permissions.forEach((p) => permissions.add(p.permission.name));

      currentRole.parentRoles.forEach((parentRole) => {
        if (parentRole.parentRole && !roles.has(parentRole.parentRole.name)) {
          stack.push(parentRole.parentRole);
        }
      });
    }
  }

  private checkSSD(roles: Set<string>): boolean {
    const ssdConstraints: [string, string][] = [['MODERATOR', 'ADMIN']];

    return this.validateConstraints(roles, ssdConstraints);
  }

  private checkDSD(roles: Set<string>): boolean {
    const dsdConstraints: [string, string][] = [['USER', 'MEMBER']];

    return this.validateConstraints(roles, dsdConstraints);
  }

  private validateConstraints(roles: Set<string>, constraints: [string, string][]): boolean {
    return constraints.every(
      (constraint) => Array.from(roles).filter((role) => constraint.includes(role)).length <= 1,
    );
  }
}
