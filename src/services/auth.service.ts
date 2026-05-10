import { BadRequestException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { LoginDto, RegisterDto, JwtPayload, ResendEmailDto, RegisterResultDto, RegisterCode, VerifyPinDto, ResendPinDto } from '../dtos/auth.dto';
import { MobileSocialLoginDto } from '../dtos/mobile-social-login.dto';
import { SocialTokenVerificationService } from './social-token-verification.service';
import { User } from '../entities/user.entity';
import { EmailService } from './email.service';
import * as crypto from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from '../entities/refresh-token.entity';
import { UpdateProfileDto } from 'src/dtos/update-profile-dto';
import { FcmTokenService } from './fcm-token.service';
import { SubscriptionStatus, UserSubscription } from 'src/entities/user-subscription.entity';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  private tempTokens: Map<string, { user: any; accessToken: string, refreshToken: string }> = new Map();
  private DEFAULT_PIN_EXPIRES_IN = 1;
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private socialTokenVerificationService: SocialTokenVerificationService,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
    @Inject(forwardRef(() => FcmTokenService))
    private fcmTokenService: FcmTokenService,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
    private configService: ConfigService
  ) {
    this.DEFAULT_PIN_EXPIRES_IN = this.configService.get<number>('pinExpiresIn') || 1;
  }

  async validateUser(username: string, password: string, locale: SupportedLocale = 'vi'): Promise<any> {
    const user = await this.userService.findByUsername(username, true);
    const m = getMessages(locale).auth;
    if (user?.isDeleted) {
      throw new BadRequestException(m.accountNotFound);
    }
    if (user?.isWebsiteUser && !user?.isEmailVerified) {
      throw new BadRequestException(m.emailNotVerified);
    }
    if (user?.isBlocked) {
      throw new BadRequestException(m.accountBlocked);
    }
    // check if user has active subscription
    await this.validateSubscription(user);
    if (user && await user.validatePassword(password)) {
      user.lastLogin = new Date();
      // await this.userService.update(user.id, user);
      const { password, ...result } = user;
      return result;
    }

    return null;
  }

  async validateSubscription(user: User | null): Promise<void> {
    if (user == null) {
      return;
    }
    const subscription = await this.userSubscriptionRepository.findOne({
      where: {
        userId: user?.id ?? 0,
      },
    });
    if (!subscription) {
      // create a free subscription
      const freeSubscriptionPlan = await this.userService.createFreeSubscription(user?.id ?? 0);
      const trialSubscription = await this.userSubscriptionRepository.create({
        userId: user?.id ?? 0,
        planId: freeSubscriptionPlan.id,
        status: SubscriptionStatus.FREE,
        startedAt: new Date(),
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
      });
      await this.userSubscriptionRepository.save(trialSubscription);
    }
  }

  async validateRegisterUser(registerDto: RegisterDto, locale: SupportedLocale = 'vi'): Promise<RegisterResultDto> {
    const existingUser = await this.userService.findByUsername(registerDto.username);
    const m = getMessages(locale).auth;
    
    if (existingUser) {
      if (existingUser.email === registerDto.email) {
        if (existingUser.isEmailVerified) {
          return {
            code: RegisterCode.AccountValidated,
            message: m.accountValidated,
            data: existingUser
          };
        } else {
          return {
            code: RegisterCode.ExistUsernameNotVerified,
            message: m.accountExistNotVerified,
            data: existingUser
          };
        }
      } else {
        return {
          code: RegisterCode.AccountIsExist,
          message: m.accountExist,
          data: existingUser
        };
      }
    } else {
      const existingEmail = await this.userService.findByEmail(registerDto.email);
      if (existingEmail && existingEmail.isWebsiteUser) {
        return {
          code: RegisterCode.ExistEmail,
          message: m.emailExist,
          data: existingEmail
        };
      }
    }
    return {
      code: RegisterCode.Ok,
      message: m.accountNotExist,
      data: null
    };
  }

  async updateProfile(updateProfileDto: UpdateProfileDto, userId: string, locale: SupportedLocale = 'vi') {
    const user = await this.userService.findById(parseInt(userId));
    if (!user) {
      throw new UnauthorizedException(getMessages(locale).auth.userNotFound);
    }
    user.fullName = updateProfileDto.fullName;
    user.picture = updateProfileDto.picture;
    user.email = updateProfileDto.email;
    user.phoneNumber = updateProfileDto.phoneNumber;
    user.address = updateProfileDto.address;
    user.birthDate = updateProfileDto.birthDate ? this.parseDateFromDDMMYYYY(updateProfileDto.birthDate) : undefined;
    user.facebookLink = updateProfileDto.facebookLink;
    user.instagramLink = updateProfileDto.instagramLink;
    user.twitterLink = updateProfileDto.twitterLink;
    user.linkedinLink = updateProfileDto.linkedinLink;
    user.countryCode = updateProfileDto.countryCode ?? '';
    user.region = updateProfileDto.region ?? '';
    user.updatedAt = new Date();
    const result = await this.userService.update(user.id, user);
    return result;
  }

  async validateSocialUser(socialUser: any): Promise<any> {
    try {
      let user = await this.userService.findByEmailSocial(socialUser.email, socialUser.platformId);

      if (!user) {
        const registerDto: RegisterDto = {
          username: socialUser.email,
          email: socialUser.email,
          fullName: socialUser.fullName,
          password: Math.random().toString(36).slice(-8),
          platformId: socialUser.platformId,
          picture: socialUser.picture,
          isGoogleUser: socialUser.isGoogleUser || false,
          isFacebookUser: socialUser.isFacebookUser || false,
          deviceId: socialUser.deviceId,
          platform: socialUser.platform,
          fcmToken: socialUser.fcmToken,
        };
        user = await this.userService.create(registerDto);
        if (socialUser.fcmToken) {
          await this.fcmTokenService.registerOrUpdate({
            token: socialUser.fcmToken,
            platform: socialUser.platform,
            deviceId: socialUser.deviceId,
          }, user.id);
        }
      } else {
        user.platformId = socialUser.platformId;
        user.picture = socialUser.picture;
        user.isGoogleUser = socialUser.isGoogleUser || false;
        user.isFacebookUser = socialUser.isFacebookUser || false;

        await this.userService.update(user.id, user);
        if (socialUser.fcmToken) {
          await this.fcmTokenService.registerOrUpdate({
            token: socialUser.fcmToken,
            platform: socialUser.platform,
            deviceId: socialUser.deviceId,
          }, user.id);
        }
      }
      await this.validateSubscription(user);
      return this.generateToken(user);
    } catch (_error) {
      console.error('Error in validateSocialUser:', _error);
      throw _error;
    }
  }

  async mobileSocialLogin(mobileSocialLoginDto: MobileSocialLoginDto, locale: SupportedLocale = 'vi', region?: string, countryCode?: string) {
    try {
      const { platformId, email, fullName, picture, platform, accessToken, fcmToken, deviceId } = mobileSocialLoginDto;
      const m = getMessages(locale).auth;

      const verifiedData = await this.socialTokenVerificationService.verifyToken(platform as any, accessToken, locale);

      if (verifiedData.platformId !== platformId) {
        throw new UnauthorizedException(m.platformIdMismatch);
      }

      const finalEmail = verifiedData.email || email;
      const finalFullName = fullName || verifiedData.fullName || 'User';

      if (!finalEmail) {
        throw new BadRequestException(m.emailNotFound);
      }

      let user = await this.userService.findByEmailSocial(finalEmail, platformId);

      if (!user) {
        const registerDto: RegisterDto = {
          username: finalEmail,
          email: finalEmail,
          fullName: finalFullName,
          password: Math.random().toString(36).slice(-8),
          platformId: platformId,
          picture: picture,
          isGoogleUser: platform === 'google',
          isFacebookUser: platform === 'facebook',
          isAppleUser: platform === 'apple',
          isEmailVerified: true,
          countryCode: countryCode,
          region: region,
        };
        user = await this.userService.create(registerDto);
      } else {
        user.platformId = platformId ?? '';
        if (picture) user.picture = picture;
        if (fullName) user.fullName = fullName;
        user.isGoogleUser = platform === 'google';
        user.isFacebookUser = platform === 'facebook';
        user.isAppleUser = platform === 'apple';

        if (region && !user.region) {
          user.region = region ?? '';
          user.countryCode = countryCode ?? '';
        }

        await this.userService.update(user.id, user);
      }
      if (fcmToken) {
        await this.fcmTokenService.registerOrUpdate({
          token: fcmToken,
          platform: platform,
          deviceId: deviceId ?? '',
        }, user.id);
      }
      await this.validateSubscription(user);

      return this.generateToken(user);
    } catch (error) {
      console.error('Error in mobileSocialLogin:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(getMessages(locale).auth.socialLoginFailed);
    }
  }

  async login(loginDto: LoginDto, locale: SupportedLocale = 'vi', region?: string, countryCode?: string) {
    const { username, password, fcmToken, platform, deviceId, appVersion } = loginDto;
    const user = await this.validateUser(username, password, locale);

    if (!user) {
      throw new BadRequestException(getMessages(locale).auth.invalidCredentials);
    }

    if (region && !user.region) {
      await this.userService.update(user.id, { region, countryCode });
      user.region = region ?? '';
      user.countryCode = countryCode ?? '';
    }

    if (fcmToken) {
      await this.fcmTokenService.registerOrUpdate({
        token: fcmToken,
        platform: platform ?? '',
        deviceId: deviceId,
        app_version: appVersion,
      }, user.id);
    }
    return this.generateToken(user);
  }

  async register(registerDto: RegisterDto, locale: SupportedLocale = 'vi') {
    const validateUser = await this.validateRegisterUser(registerDto, locale);
    const m = getMessages(locale).auth;
    
    if (validateUser.code === RegisterCode.Ok) {
      const user = await this.userService.create({
        ...registerDto,
        isEmailVerified: false,
        isWebsiteUser: true,
      });

      if (user.email) {
        const pin = await this.generateAndSavePin(user, this.DEFAULT_PIN_EXPIRES_IN);
        await this.emailService.sendPinEmail(
          user.email,
          pin,
          user.fullName || user.username
        );

        return {
          code: RegisterCode.Ok,
          message: m.pinSent,
          data: {
            ...user,
            pin: pin
          }
        };
      }
      return {
        code: RegisterCode.Ok,
        message: m.registerSuccess,
        data: user
      };
    } else {
      if (validateUser.code === RegisterCode.ExistUsernameNotVerified) {
        const pin = await this.generateAndSavePin(validateUser.data);
        await this.emailService.sendPinEmail(
          validateUser.data.email,
          pin,
          validateUser.data.fullName || validateUser.data.username
        );
        return {
          code: RegisterCode.Ok,
          message: m.pinSent,
          data: {
            ...validateUser.data,
            pin: pin
          }
        };
      }
      return validateUser;
    }
  }

  async verifyToken(token: string, locale: SupportedLocale = 'vi') {
    const result = await this.validateToken(token, locale);
    return result;
  }

  async resendEmail(resendEmailDto: ResendEmailDto, locale: SupportedLocale = 'vi') {
    const { email } = resendEmailDto;
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException(getMessages(locale).auth.emailNotExist);
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

  async verifyEmail(token: string, locale: SupportedLocale = 'vi') {
    const user = await this.userService.findByVerificationToken(token);
    if (!user) {
      throw new UnauthorizedException(getMessages(locale).auth.invalidVerificationToken);
    }

    user.isEmailVerified = true;
    user.verificationToken = '';
    await this.userService.update(user.id, user);

    return { message: getMessages(locale).auth.emailVerified };
  }

  async getProfile(user: User) {
    return user;
  }

  async generateToken(user: User) {
    const permissions = user.roles.flatMap(role => role.permissions);
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
      countryCode: user.countryCode,
      region: user.region,
      roles: user.roles.map(role => role.id),
      permissions: permissions?.map(permission => permission?.code),
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = await this.createRefreshToken(user);

    user.roles = user.roles.map(role => ({ ...role, permissions: [] }));
    user.permissions = permissions?.map(permission => permission?.code);
    return {
      accessToken,
      refreshToken: refreshToken.token,
      user: user,
    };
  }

  private async createRefreshToken(user: User): Promise<RefreshToken> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const refreshToken = this.refreshTokenRepository.create({
      token,
      expiresAt,
      userId: user.id
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  async refreshAccessToken(refreshTokenString: string, locale: SupportedLocale = 'vi') {
    const foundToken = await this.refreshTokenRepository.findOne({
      where: { token: refreshTokenString, isRevoked: false },
      relations: ['user', 'user.roles', 'user.roles.permissions']
    });

    const m = getMessages(locale).auth;

    if (!foundToken) {
      throw new UnauthorizedException({
        status: 401,
        message: m.refreshTokenInvalid,
        code: 'refresh_token_invalid',
        statusCode: 401,
        data: null
      });
    }

    if (new Date() > foundToken.expiresAt) {
      await this.revokeRefreshToken(refreshTokenString);
      throw new UnauthorizedException({
        status: 401,
        message: m.refreshTokenExpired,
        code: 'refresh_token_expired',
        statusCode: 401,
        data: null
      });
    }
    const permissions = foundToken.user.roles.flatMap(role => role.permissions).filter(permission => permission.isActive);
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
      countryCode: foundToken.user.countryCode,
      region: foundToken.user.region,
      roles: foundToken.user.roles.map(role => role.id),
      permissions: permissions?.map(permission => permission?.code),
    };
    foundToken.user.roles = foundToken.user.roles.map(role => ({ ...role, permissions: [] }));
    foundToken.user.permissions = permissions?.map(permission => permission?.code);
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

    this.tempTokens.set(tempToken, {
      user: userInfo.user,
      accessToken: userInfo.accessToken,
      refreshToken: userInfo.refreshToken
    });

    setTimeout(() => {
      this.tempTokens.delete(tempToken);
    }, 5 * 60 * 1000);

    return tempToken;
  }

  async getTempTokenInfo(tempToken: string, locale: SupportedLocale = 'vi') {
    const info = this.tempTokens.get(tempToken);
    if (!info) {
      throw new UnauthorizedException(getMessages(locale).auth.tokenInvalid);
    }
    return info;
  }

  async forgotPassword(username: string, locale: SupportedLocale = 'vi') {
    const user = await this.userService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException(getMessages(locale).auth.accountNotFound);
    }
    const pin = await this.generateAndSavePin(user, this.DEFAULT_PIN_EXPIRES_IN);
    await this.emailService.sendForgotPasswordEmail(
      user.email,
      pin,
      user.fullName || user.username,
      this.DEFAULT_PIN_EXPIRES_IN
    );
    return { code: 'verify-pin', email: user.email };
  }

  async resetPassword(username: string, newPassword: string, locale: SupportedLocale = 'vi') {
    const m = getMessages(locale).auth;
    try {
      const user = await this.userService.findByUsername(username);
      if (!user) {
        throw new UnauthorizedException(m.accountNotFound);
      }
      user.password = newPassword;
      await this.userService.update(user.id, user);
      return { code: 'reset-password', status: 'success', data: { message: m.passwordResetSuccess } };
    } catch (error) {
      return { code: 'reset-password', status: 'error', data: { message: m.passwordResetFailed } };
    }
  }

  async validateToken(token: string, locale: SupportedLocale = 'vi') {
    try {
      const decoded = this.jwtService.verify(token);
      return decoded;
    } catch (error) {
      throw new UnauthorizedException({
        status: 401,
        message: getMessages(locale).auth.tokenInvalid,
        code: 'token_invalid',
        statusCode: 401,
        data: null
      });
    }
  }

  private generatePin(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
  }

  async generateAndSavePin(user: User, expiresIn: number = 1): Promise<string> {
    const pin = this.generatePin();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresIn);

    user.pinCode = pin;
    user.pinExpiresAt = expiresAt;
    await this.userService.update(user.id, user);

    return pin;
  }

  async deleteAccount(userId: number, locale: SupportedLocale = 'vi') {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException(getMessages(locale).auth.userNotFound);
    }
    user.isDeleted = true;
    user.deletedAt = new Date();
    await this.userService.update(user.id, user);

    return { code: 'delete-account', status: 'success', data: { message: getMessages(locale).auth.accountDeleted } };
  }

  async verifyPin(verifyPinDto: VerifyPinDto, locale: SupportedLocale = 'vi') {
    const { email, pin } = verifyPinDto;
    const m = getMessages(locale).auth;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(m.emailNotExist);
    }

    if (!user.pinCode || !user.pinExpiresAt) {
      throw new BadRequestException(m.pinNotFound);
    }

    if (new Date() > user.pinExpiresAt) {
      throw new BadRequestException(m.pinExpired);
    }

    if (user.pinCode !== pin) {
      throw new BadRequestException(m.pinInvalid);
    }

    user.isEmailVerified = true;
    user.pinCode = '';
    user.pinExpiresAt = undefined;
    user.verificationToken = '';
    await this.userService.update(user.id, user);

    return {
      code: 'verify',
      message: m.pinVerified
    };
  }

  async resendPin(resendPinDto: ResendPinDto, locale: SupportedLocale = 'vi') {
    const { email } = resendPinDto;

    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new BadRequestException(getMessages(locale).auth.emailNotExist);
    }

    const pin = await this.generateAndSavePin(user, this.DEFAULT_PIN_EXPIRES_IN);

    await this.emailService.sendPinEmail(
      user.email,
      pin,
      user.fullName || user.username
    );

    return {
      code: 'resend',
      message: getMessages(locale).auth.pinResent,
    };
  }

  private parseDateFromDDMMYYYY(dateString: string): Date | undefined {
    try {
      const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
      const match = dateString.match(dateRegex);

      if (!match) {
        throw new Error('Invalid date format. Expected dd/MM/yyyy');
      }

      const day = parseInt(match[1], 10);
      const month = parseInt(match[2], 10);
      const year = parseInt(match[3], 10);

      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
        throw new Error('Invalid date values');
      }

      const date = new Date(year, month - 1, day);

      if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
        throw new Error('Invalid date');
      }

      return date;
    } catch (error) {
      console.error('Error parsing date:', error);
      return undefined;
    }
  }
}