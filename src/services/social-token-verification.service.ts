import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as appleSignin from 'apple-signin-auth';
import { getMessages, SupportedLocale } from 'src/constants/messages';

export interface VerifiedUserData {
  platformId: string;
  email: string;
  fullName: string;
  picture?: string;
  platform: 'google' | 'facebook' | 'apple';
}

@Injectable()
export class SocialTokenVerificationService {
  constructor(private configService: ConfigService) {}

  /**
   * Verify Google access token và lấy thông tin user
   */
  async verifyGoogleToken(accessToken: string, locale: SupportedLocale = 'vi'): Promise<VerifiedUserData> {
    const m = getMessages(locale).social;
    try {
      const response = await axios.get(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      const userData = response.data;

      if (!userData.id || !userData.email) {
        throw new UnauthorizedException(m.invalidGoogleToken);
      }

      return {
        platformId: userData.id,
        email: userData.email,
        fullName: userData.name || '',
        picture: userData.picture,
        platform: 'google',
      };
    } catch (error) {
      console.error('Google token verification error:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(m.googleVerificationFailed);
    }
  }

  /**
   * Verify Facebook access token và lấy thông tin user
   */
  async verifyFacebookToken(accessToken: string, locale: SupportedLocale = 'vi'): Promise<VerifiedUserData> {
    const m = getMessages(locale).social;
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      );

      const userData = response.data;

      if (!userData.id || !userData.email) {
        throw new UnauthorizedException(m.invalidFacebookToken);
      }

      return {
        platformId: userData.id,
        email: userData.email,
        fullName: userData.name || '',
        picture: userData.picture?.data?.url,
        platform: 'facebook',
      };
    } catch (error) {
      console.error('Facebook token verification error:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(m.facebookVerificationFailed);
    }
  }

  /**
   * Verify Apple identity token và lấy thông tin user
   */
  async verifyAppleToken(identityToken: string, locale: SupportedLocale = 'vi'): Promise<VerifiedUserData> {
    const m = getMessages(locale).social;
    try {
      const { sub: platformId, email } = await appleSignin.verifyIdToken(identityToken, {
        audience: 'com.hungvv.readbox',
        ignoreExpiration: false,
      });

      if (!platformId || !email) {
        throw new UnauthorizedException(m.invalidAppleToken);
      }

      return {
        platformId,
        email,
        fullName: '',
        platform: 'apple',
      };
    } catch (error) {
      console.error('Apple token verification error:', error);
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException(m.appleVerificationFailed);
    }
  }

  /**
   * Verify token dựa trên platform
   */
  async verifyToken(platform: 'google' | 'facebook' | 'apple', accessToken: string, locale: SupportedLocale = 'vi'): Promise<VerifiedUserData> {
    switch (platform) {
      case 'google':
        return this.verifyGoogleToken(accessToken, locale);
      case 'facebook':
        return this.verifyFacebookToken(accessToken, locale);
      case 'apple':
        return this.verifyAppleToken(accessToken, locale);
      default:
        throw new UnauthorizedException(getMessages(locale).social.unsupportedPlatform);
    }
  }
}
