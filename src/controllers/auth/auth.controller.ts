import { Controller, Post, Body, Get, UseGuards, Request, Res, Query, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../services/auth.service';
import { LoginDto, RegisterDto, ResendEmailDto, ResetPasswordDto, VerifyPinDto, ResendPinDto } from '../../dtos/auth.dto';
import { MobileSocialLoginDto } from '../../dtos/mobile-social-login.dto';
import { JwtAuthGuard, Public } from '../../guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { BaseController } from '../base/base.controller';
import { UpdateProfileDto } from '../../dtos/update-profile-dto';

@Controller('auth')
export class AuthController extends BaseController{
  constructor(private authService: AuthService) {
    super();
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.login(loginDto);
      return this.success(res,result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto, @Res() res: Response) {
    try {
    const result = await this.authService.register(registerDto);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('resend-email')
  async resendEmail(@Body() resendEmailDto: ResendEmailDto, @Res() res: Response) {
    try {
      const result = await this.authService.resendEmail(resendEmailDto);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string, @Res() res: Response) {
      try {
      const result = await this.authService.verifyEmail(token);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req, @Res() res: Response) {
    try {
        const result = await this.authService.getProfile(req.userß);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post('update-profile')
  async updateProfile(@Body() updateProfileDto: UpdateProfileDto, @Request() req, @Res() res: Response) {
    try {
      const result = await this.authService.updateProfile(updateProfileDto, req.user.id);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Request() req) {
    console.log('Starting Google authentication process');
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Request() req, @Res() res: Response) {
    try {
      const userInfo = req.user;
      const tempToken = await this.authService.createTempToken(userInfo);
      res.redirect(`${process.env.CLIENT_URL}/success?token=${tempToken}`);
    } catch (_error) {
      console.error('Google authentication error:', _error);
      res.redirect(`${process.env.CLIENT_URL}/error?message=Authentication failed`);
    }
  }

  @Public()
  @Get('facebook')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuth(@Request() req) {
    console.log('Starting Facebook authentication process');
  }

  @Public()
  @Get('facebook/callback')
  @UseGuards(AuthGuard('facebook'))
  async facebookAuthCallback(@Request() req, @Res() res: Response) {
    try {
      const userInfo = req.user;
      const tempToken = await this.authService.createTempToken(userInfo);
      res.redirect(`${process.env.CLIENT_URL}/success?token=${tempToken}`);
    } catch (_error) {
      console.error('Facebook authentication error:', _error);
      res.redirect(`${process.env.CLIENT_URL}/error?message=Authentication failed`);
    }
  }

  @Public()
  @Get('token-info')
  async getTokenInfo(@Query('token') token: string, @Res() res: Response) {
      try {
      const result = await this.authService.getTempTokenInfo(token);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('refresh-token')
  async refreshToken(@Body('refreshToken') refreshToken: string, @Res() res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    try {
      const result = await this.authService.refreshAccessToken(refreshToken);
      return this.success(res, result);
    } catch (error) {
      const _error = error.response;
      return this.error(res, {
        status: _error.status,
        message: _error.message,
        code: _error.code,
        statusCode: _error.statusCode,
        data: _error.data,
      });
    }
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(@Body('refreshToken') refreshToken: string, @Res() res: Response) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }
    await this.authService.revokeRefreshToken(refreshToken);
    return this.success(res, { message: 'Đăng xuất thành công' });
  }

  @Public()
  @Get('forgot-password')
  async forgotPassword(@Query('username') username: string, @Res() res: Response) {
        try {
      const result = await this.authService.forgotPassword(username);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto, @Res() res: Response) {
      try {
      const result = await this.authService.resetPassword(resetPasswordDto.token, resetPasswordDto.password);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('validate-token')
  async validateToken(@Query('token') token: string, @Res() res: Response) {
      try {
      const result = await this.authService.validateToken(token);
      return this.success(res, result);
    } catch (error) {
      const _error = error.response;
      return this.error(res, {
        status: _error.status,
        message: _error.message,
        code: _error.code,
        statusCode: _error.statusCode,
        data: _error.data,
      });
    }
  }

  @Public()
  @Post('mobile/social-login')
  async mobileSocialLogin(@Body() mobileSocialLoginDto: MobileSocialLoginDto, @Res() res: Response) {
    try {
      const result = await this.authService.mobileSocialLogin(mobileSocialLoginDto);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('verify-pin')
  async verifyPin(@Body() verifyPinDto: VerifyPinDto, @Res() res: Response) {
    try {
      const result = await this.authService.verifyPin(verifyPinDto);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Post('resend-pin')
  async resendPin(@Body() resendPinDto: ResendPinDto, @Res() res: Response) {
    try {
      const result = await this.authService.resendPin(resendPinDto);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 