import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { UpdateUserProfileDto, UserResponseDto, UserResponseTransformer } from './dto/user.dto';

import { PrismaService } from '@/common/prisma/prisma.service';
import { ResponseDto } from '@/common/dto/response.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserInfo(userId: string, currentUserId?: string): Promise<ResponseDto<UserResponseDto>> {
    if (!userId) {
      throw new NotFoundException('用户ID未提供或无效');
    }

    // 查询用户及其相关信息
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true, // 关联用户的个人资料
        _count: {
          select: {
            followers: true, // 粉丝数量
            follows: true, // 关注数量
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('未找到对应的用户');
    }

    let is_following = false;

    // 检查当前用户是否关注了目标用户
    if (currentUserId) {
      const followRecord = await this.prisma.userFollow.findFirst({
        where: {
          user_id: currentUserId, // 当前用户
          target_user_id: userId, // 目标用户
          is_deleted: false, // 排除被逻辑删除的记录
        },
      });
      is_following = !!followRecord; // 如果找到记录，则说明已关注
    }

    // 使用 Transformer 处理返回数据
    const userResponse = plainToClass(UserResponseTransformer, user);

    return {
      data: {
        ...userResponse,
        is_following, // 是否已关注目标用户
        followers_count: user._count.followers, // 粉丝数量
        following_count: user._count.follows, // 关注数量
      },
    };
  }

  async getEditableUserProfile(userId: string): Promise<ResponseDto<any>> {
    // 查询用户时只选择需要的字段
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        phone: true,
        avatar: true, // 注意字段映射
        profile: {
          select: {
            desc: true,
            gender: true,
            birth: true,
            job_title: true,
            company: true,
            location: true,
            website: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return {
      message: '获取用户可编辑个人信息成功',
      data: user,
    };
  }

  async updateUserProfile(
    userId: string,
    updateData: UpdateUserProfileDto,
  ): Promise<ResponseDto<UserResponseDto>> {
    // 检查用户是否存在
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!existingUser) {
      throw new NotFoundException('用户不存在');
    }

    // 验证用户名唯一性
    if (updateData.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: updateData.username },
      });

      if (usernameExists) {
        throw new BadRequestException('该用户名已被使用');
      }
    }

    // 更新用户及其关联的个人资料
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: updateData.username,
        phone: updateData.phone,
        avatar: updateData.avatar, // 注意字段映射关系

        profile: {
          update: {
            desc: updateData.desc,
            gender: updateData.gender,
            birth: updateData.birth,
            job_title: updateData.job_title,
            company: updateData.company,
            location: updateData.location,
            website: updateData.website,
          },
        },
      },
      include: { profile: true }, // 包含更新后的个人资料
    });

    // 使用 Transformer 生成响应数据
    const userResponse = plainToClass(UserResponseTransformer, updatedUser);

    return {
      data: userResponse,
    };
  }

  async followUser(user_id: string, target_user_id: string): Promise<ResponseDto<void>> {
    if (user_id === target_user_id) {
      throw new BadRequestException('不能关注自己');
    }

    // 检查目标用户是否存在
    const target_user_exists = await this.prisma.user.findUnique({
      where: { id: target_user_id },
      select: { id: true },
    });

    if (!target_user_exists) {
      throw new NotFoundException('目标用户不存在');
    }

    // 检查是否已关注
    const existing_follow = await this.prisma.userFollow.findUnique({
      where: {
        user_id_target_user_id: {
          user_id: user_id,
          target_user_id: target_user_id,
        },
      },
    });

    if (existing_follow) {
      throw new BadRequestException('已关注该用户');
    }

    // 添加关注关系
    await this.prisma.userFollow.create({
      data: {
        user_id: user_id,
        target_user_id: target_user_id,
      },
    });

    return {
      code: 201,
      message: '关注成功',
      data: null,
    };
  }

  async unFollowUser(user_id: string, target_user_id: string): Promise<ResponseDto<void>> {
    const follow = await this.prisma.userFollow.findUnique({
      where: {
        user_id_target_user_id: {
          user_id: user_id,
          target_user_id: target_user_id,
        },
      },
    });

    if (!follow) {
      throw new NotFoundException('未找到关注关系，无法取消关注');
    }

    // 如果已逻辑删除，抛出异常
    if (follow.is_deleted) {
      throw new BadRequestException('关注关系已取消');
    }

    // 执行逻辑删除（标记为已删除）
    await this.prisma.userFollow.update({
      where: {
        user_id_target_user_id: {
          user_id: user_id,
          target_user_id: target_user_id,
        },
      },
      data: {
        is_deleted: true,
        created_at: follow.created_at,
      },
    });

    return {
      code: 200,
      message: '取消关注成功',
      data: null,
    };
  }

  async updateUserRole(userId: string, newRoleId: number): Promise<ResponseDto<void>> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user) {
        throw new NotFoundException('用户未找到');
      }

      const newRole = await this.prisma.role.findUnique({
        where: { id: newRoleId },
      });

      if (!newRole) {
        throw new NotFoundException('角色未找到');
      }

      if (!(await this.checkSSD(userId, newRoleId))) {
        throw new BadRequestException('静态分离职责限制，无法分配该角色');
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: { role_id: newRoleId },
      });

      return { data: null };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      console.error('更新用户角色时发生未知错误:', error);
      throw new InternalServerErrorException('无法更新用户角色，请稍后重试');
    }
  }

  private async checkSSD(userId: string, newRoleId: number): Promise<boolean> {
    const ssdConstraints = [{ roleA: 'MODERATOR', roleB: 'ADMIN' }];

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { role: true },
    });

    if (!user || !user.role) return true;

    const newRole = await this.prisma.role.findUnique({
      where: { id: newRoleId },
    });

    if (!newRole) {
      throw new NotFoundException('新角色未找到');
    }

    return ssdConstraints.every(({ roleA, roleB }) => {
      return !(
        (user.role.name === roleA && newRole.name === roleB) ||
        (user.role.name === roleB && newRole.name === roleA)
      );
    });
  }

  async get_following_list(user_id: string): Promise<ResponseDto<UserResponseDto[]>> {
    const following_users = await this.prisma.userFollow.findMany({
      where: { user_id, is_deleted: false }, // 筛选逻辑未删除的关注关系
      include: {
        target_user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                desc: true, // 选择简介
              },
            },
          },
        },
      },
    });

    // 检查是否有数据
    if (following_users.length === 0) {
      return {
        code: 200,
        message: '暂无关注的用户',
        data: [],
      };
    }

    // 格式化数据
    const data = following_users.map((follow) => ({
      id: follow.target_user.id,
      username: follow.target_user.username,
      avatar: follow.target_user.avatar || null,
      desc: follow.target_user.profile?.desc || null, // 简介可能为空
    }));

    return {
      code: 200,
      message: '获取关注列表成功',
      data,
    };
  }

  async get_follower_list(user_id: string): Promise<ResponseDto<UserResponseDto[]>> {
    const followers = await this.prisma.userFollow.findMany({
      where: { target_user_id: user_id, is_deleted: false }, // 筛选逻辑未删除的关注关系
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            profile: {
              select: {
                desc: true, // 选择简介
              },
            },
          },
        },
      },
    });

    // 检查是否有数据
    if (followers.length === 0) {
      return {
        code: 200,
        message: '暂无粉丝',
        data: [],
      };
    }

    // 格式化数据
    const data = followers.map((follow) => ({
      id: follow.user.id,
      username: follow.user.username,
      avatar: follow.user.avatar || null,
      desc: follow.user.profile?.desc || null, // 简介可能为空
    }));

    return {
      code: 200,
      message: '获取粉丝列表成功',
      data,
    };
  }
}
