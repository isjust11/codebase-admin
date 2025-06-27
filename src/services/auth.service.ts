import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { LoginDto, RegisterDto, JwtPayload, ResendEmailDto, RegisterResultDto, RegisterCode } from '../dtos/auth.dto';
import { User } from '../entities/user.entity';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RoleEnum } from 'src/enums/role.enum';

@Injectable()
export class AuthService {
  private tempTokens: Map<string, { user: any; accessToken: string, refreshToken: string }> = new Map();

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) { }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    if (user?.isBlocked) {
      throw new UnauthorizedException('Tài khoản đã bị khóa');
    }
    if (user && await user.validatePassword(password)) {
      user.lastLogin = new Date();
      await this.userService.update(user.id, user);
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async validateWebsiteUser(registerDto: RegisterDto): Promise<RegisterResultDto> {
    const existingUser = await this.userService.findByUsername(registerDto.username);
    // trường hợp đã tồn tại tài khoản và email trùng nhau
    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        if (existingUser.isEmailVerified) {
          return {
            code: RegisterCode.AccountValidated,
            message: 'Tài khoản đã được xác thực',
            data: existingUser
          };
        } else {
          return {
            code: RegisterCode.ExistUsernameNotVerified,
            message: 'Tài khoản chưa được xác thực',
            data: existingUser
          };
        }
      } else {
        // tài khoản đã tồn tại nhưng email khác
        return {
          code: RegisterCode.AccountIsExist,
          message: 'Tài khoản đã tồn tại',
          data: existingUser
        };
      }
    } else {
      const existingEmail = await this.userService.findByEmail(registerDto.email);
      if (existingEmail && existingEmail.isWebsiteUser) {
        return {
          code: RegisterCode.ExistEmail,
          message: 'Email đã được đăng ký bởi tài khoản khác',
          data: existingEmail
        };
      }
    }
    return {
      code: RegisterCode.Ok,
      message: 'Tài khoản chưa tồn tại',
      data: null
    };
  }


  async validateSocialUser(socialUser: any): Promise<any> {
    try {
      // Tìm user theo email
      let user = await this.userService.findByEmailSocial(socialUser.email, socialUser.platformId);

      if (!user) {
        // Tạo user mới nếu chưa tồn tại
        const registerDto: RegisterDto = {
          username: socialUser.email,
          email: socialUser.email,
          fullName: socialUser.fullName,
          password: Math.random().toString(36).slice(-8), // Tạo mật khẩu ngẫu nhiên
          platformId: socialUser.platformId, // Lưu ID từ Google
          picture: socialUser.picture, // Lưu ảnh đại diện
          isGoogleUser: socialUser.isGoogleUser || false, // Đánh dấu là user đăng nhập bằng Google
          isFacebookUser: socialUser.isFacebookUser || false,
        };
        user = await this.userService.create(registerDto);
      } else {
        // Cập nhật thông tin nếu user đã tồn tại
        user.platformId = socialUser.platformId;
        user.picture = socialUser.picture;
        user.isGoogleUser = socialUser.isGoogleUser || false;
        user.isFacebookUser = socialUser.isFacebookUser || false;
        await this.userService.update(user.id, user);
      }

      return this.generateToken(user);
    } catch (_error) {
      console.error('Error in validateSocialUser:', _error);
      throw _error;
    }
  }

  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;
    const user = await this.validateUser(username, password);

    if (!user) {
      throw new UnauthorizedException('Tài khoản hoặc mật khẩu không chính xác');
    }

    if (user.isWebsiteUser && !user.isEmailVerified) {
      throw new UnauthorizedException('Email chưa được xác thực');
    }

    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto) {
    const validateUser = await this.validateWebsiteUser(registerDto);
    if (validateUser.code === RegisterCode.Ok) {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const user = await this.userService.create({
        ...registerDto,
        verificationToken,
        isEmailVerified: false,
        isWebsiteUser: true,
      });

      // Gửi email xác thực
      if (user.email) {
        await this.emailService.sendVerificationEmail(
          user.email,
          verificationToken,
          user.fullName || user.username
        );
      }
      return {
        code: RegisterCode.Ok,
        message: 'Email đã được gửi đến bạn',
        data: user
      };
    } else {
      // trường hợp tài khoản đã tồn tại
      if (validateUser.code === RegisterCode.ExistUsernameNotVerified) {
        const verificationToken = crypto.randomBytes(32).toString('hex');
        validateUser.data.verificationToken = verificationToken;
        await this.userService.update(validateUser.data.id, validateUser.data);
        await this.emailService.sendVerificationEmail(
          validateUser.data.email,
          verificationToken,
          validateUser.data.fullName || validateUser.data.username
        );
        return {
          code: RegisterCode.Ok,
          message: 'Email đã được gửi đến bạn',
          data: validateUser.data
        };
      }
      return validateUser;
    }
  }

  async resendEmail(resendEmailDto: ResendEmailDto) {
    const { email } = resendEmailDto;
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Email không tồn tại');
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await this.userService.update(user.id, user);
    await this.emailService.sendVerificationEmail(
      user.email,
      verificationToken,
      user.fullName || user.username
    );
  }

  async verifyEmail(token: string) {
    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException('Token xác thực không hợp lệ');
    }

    user.isEmailVerified = true;
    user.verificationToken = '';
    await this.userService.update(user.id, user);

    return { message: 'Email đã được xác thực thành công' };
  }

  async generateToken(user: User) {
    const payload: JwtPayload = {
      id: user.id,
      username: user.username,
      sub: user.id,
      picture: user.picture,
      email: user.email,
      fullName: user.fullName,
      platformId: user.platformId,
      isGoogleUser: user.isGoogleUser,
      isFacebookUser: user.isFacebookUser,
      isAdmin: user.isAdmin,
      roles: user.roles,
    };

    // Tạo access token
    const accessToken = this.jwtService.sign(payload);

    // Tạo refresh token
    const refreshToken = await this.createRefreshToken(user);

    // Cập nhật thời gian đăng nhập
    user.lastLogin = new Date();
    await this.userService.update(user.id, user);
    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: user,
    };
  }

  private async createRefreshToken(user: User): Promise<RefreshToken> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token hết hạn sau 7 ngày

    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId: user.id
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async refreshAccessToken(refreshTokenString: string) {
    const foundToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString, isRevoked: false },
      relations: ['user', 'user.roles']
    });

    if (!foundToken) {
      throw new UnauthorizedException('Refresh token không hợp lệ');
    }

    if (new Date() > foundToken.expiresAt) {
      throw new UnauthorizedException('Refresh token đã hết hạn');
    }

    const payload: JwtPayload = {
      id: foundToken.user.id,
      username: foundToken.user.username,
      sub: foundToken.user.id,
      picture: foundToken.user.picture,
      email: foundToken.user.email,
      fullName: foundToken.user.fullName,
      platformId: foundToken.user.platformId,
      isGoogleUser: foundToken.user.isGoogleUser,
      isFacebookUser: foundToken.user.isFacebookUser,
      isAdmin: foundToken.user.isAdmin,
      roles: foundToken.user.roles,
    };

    // Tạo access token mới
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: foundToken.token,
      user: foundToken.user
    };
  }

  async revokeRefreshToken(token: string) {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { token }
    });

    if (refreshToken) {
      refreshToken.isRevoked = true;
      await this.refreshTokenRepository.save(refreshToken);
    }
  }

  async createTempToken(userInfo: any) {
    const tempToken = crypto.randomBytes(32).toString('hex');

    // Lưu thông tin vào bộ nhớ tạm thời
    this.tempTokens.set(tempToken, {
      user: userInfo.user,
      accessToken: userInfo.accessToken,
      refreshToken: userInfo.refreshToken
    });

    // Tự động xóa sau 5 phút
    setTimeout(() => {
      this.tempTokens.delete(tempToken);
    }, 5 * 60 * 1000);

    return tempToken;
  }

  async getTempTokenInfo(tempToken: string) {
    const info = this.tempTokens.get(tempToken);
    if (!info) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    return info;
  }

  async forgotPassword(username: string) {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = verificationToken;
    await this.userService.update(user.id, user);
    await this.emailService.sendForgotPasswordEmail(
      user.email,
      verificationToken,
      user.fullName || user.username
    );
    return { message: `Email đã được gửi đến email ${user.email}` };
  }

  async resetPassword(token: string, password: string) {
    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    user.verificationToken = '';
    user.password = password;
    await this.userService.update(user.id, user);
    return { message: 'Mật khẩu đã được khôi phục thành công' };
  }

  async validateToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
  }
} 