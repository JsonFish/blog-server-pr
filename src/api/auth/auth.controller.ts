import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  SendVerificationCodeResponseDto,
  SendVerificationCodeDto,
  LoginResponseDto,
  EmailLoginDto,
} from './dto/auth.dto';

import { ApiResponseWithDto } from '@/core/decorate/api-response.decorator';
import { ResponseDto } from '@/common/dto/response.dto';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponseWithDto(SendVerificationCodeResponseDto, '发送验证码成功', HttpStatus.OK)
  async sendVerificationCode(
    @Body() sendVerificationCodeDto: SendVerificationCodeDto,
  ): Promise<ResponseDto<SendVerificationCodeResponseDto>> {
    return await this.authService.sendVerificationCode(sendVerificationCodeDto);
  }

  @Post('login/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '邮箱验证码登录' })
  @ApiResponseWithDto(LoginResponseDto, '登录成功', HttpStatus.OK)
  async emailLogin(@Body() loginDto: EmailLoginDto): Promise<ResponseDto<LoginResponseDto>> {
    return await this.authService.emailLogin(loginDto);
  }
}
