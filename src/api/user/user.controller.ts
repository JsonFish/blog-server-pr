import {
  Controller,
  Get,
  HttpStatus,
  Request,
  UseGuards,
  Patch,
  Body,
  Post,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { UserService } from './user.service';
import { UpdateUserProfileDto, UserIdDto, UserResponseDto } from './dto/user.dto';

import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';
import { RequestWithUser } from '@/common/types';
import { ResponseDto } from '@/common/dto/response.dto';
import { PermissionsEnum } from '@/common/enum/permission.enum';
import { PermissionsGuard } from '@/core/guard/permissions.guard';
import { Permissions } from '@/core/decorate/permissions.decorator';
import { OptionalJwtAuthGuard } from '@/core/guard/optional-jwt-auth.guard';

@Controller('user')
@ApiTags('User')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: '获取指定用户信息（自己的或其他用户的）' })
  @ApiParam({
    name: 'id',
    description: '目标用户ID，传入自己的ID获取自己的信息或他人的ID获取他人的信息',
  })
  @ApiResponseWithDto(UserResponseDto, '返回指定用户的信息', HttpStatus.OK)
  async getUserInfo(
    @Param() param: UserIdDto,
    @Request() req: RequestWithUser,
  ): Promise<ResponseDto<UserResponseDto>> {
    const currentUserId = req.user?.id;

    return await this.userService.getUserInfo(param.id, currentUserId);
  }

  @Get('profile')
  @ApiOperation({ summary: '获取当前用户的可编辑个人信息' })
  async getCurrentUserEditableProfile(@Request() req: RequestWithUser): Promise<ResponseDto<any>> {
    const userId = req.user.id;

    return await this.userService.getEditableUserProfile(userId);
  }

  @Patch()
  @ApiOperation({ summary: '更新用户资料' })
  @UseGuards(AuthGuard('jwt'))
  @ApiResponseWithDto(UserResponseDto, '更新用户资料', HttpStatus.OK)
  async updateUserProfile(
    @Request() req: RequestWithUser,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<ResponseDto<any>> {
    return await this.userService.updateUserProfile(req.user.id, updateUserProfileDto);
  }

  @Post('follow/:target_user_id')
  @ApiOperation({ summary: '关注用户' })
  @ApiParam({ name: 'target_user_id', description: '目标用户的ID' })
  @UseGuards(AuthGuard('jwt'))
  async followUser(
    @Request() req: RequestWithUser,
    @Param('target_user_id') target_user_id: string,
  ): Promise<ResponseDto<void>> {
    return await this.userService.followUser(req.user.id, target_user_id);
  }

  @Delete('unfollow/:target_user_id')
  @ApiOperation({ summary: '取消关注用户' })
  @ApiParam({ name: 'target_user_id', description: '目标用户的ID' })
  @UseGuards(AuthGuard('jwt'))
  async unFollowUser(
    @Request() req: RequestWithUser,
    @Param('target_user_id') target_user_id: string,
  ): Promise<ResponseDto<void>> {
    return await this.userService.unFollowUser(req.user.id, target_user_id);
  }

  @Patch(':userId/role')
  @Permissions(PermissionsEnum.ADMINISTER)
  @ApiOperation({
    summary: '更新用户角色',
    description: '管理员可以通过此接口更新指定用户的角色。需要提供用户ID和新的角色ID。',
  })
  @ApiParam({
    name: 'userId',
    required: true,
    description: '用户的唯一标识符，用于确定要更新的用户。',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiBody({
    description: '请求体包含新的角色ID',
    required: true,
    schema: {
      type: 'object',
      properties: {
        newRoleId: {
          type: 'number',
          description: '要分配给用户的新角色ID。',
          example: 2,
        },
      },
    },
  })
  async updateUserRole(
    @Param('userId') userId: string,
    @Body('newRoleId') newRoleId: number,
  ): Promise<ResponseDto<void>> {
    return await this.userService.updateUserRole(userId, newRoleId);
  }

  @Get('following')
  @ApiOperation({ summary: '获取关注列表' })
  @UseGuards(AuthGuard('jwt'))
  @ApiResponseWithDto(UserResponseDto, '获取关注列表', HttpStatus.OK)
  async getFollowingList(@Request() req: RequestWithUser): Promise<ResponseDto<UserResponseDto[]>> {
    return await this.userService.get_following_list(req.user.id);
  }

  @Get('followers')
  @ApiOperation({ summary: '获取粉丝列表' })
  @UseGuards(AuthGuard('jwt'))
  @ApiResponseWithDto(UserResponseDto, '获取粉丝列表', HttpStatus.OK)
  async getFollowerList(@Request() req: RequestWithUser): Promise<ResponseDto<UserResponseDto[]>> {
    return await this.userService.get_follower_list(req.user.id);
  }
}
