import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface VerifiedUserData {
  platformId: string;
  email: string;
  fullName: string;
  picture?: string;
  platform: 'google' | 'facebook';
}

@Injectable()
export class SocialTokenVerificationService {
  constructor(private configService: ConfigService) {}

  /**
   * Verify Google access token và lấy thông tin user
   */
  async verifyGoogleToken(accessToken: string): Promise<VerifiedUserData> {
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
        throw new UnauthorizedException('Invalid Google token or missing user data');
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
      throw new UnauthorizedException('Google token verification failed');
    }
  }

  /**
   * Verify Facebook access token và lấy thông tin user
   */
  async verifyFacebookToken(accessToken: string): Promise<VerifiedUserData> {
    try {
      const response = await axios.get(
        `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      );

      const userData = response.data;

      if (!userData.id || !userData.email) {
        throw new UnauthorizedException('Invalid Facebook token or missing user data');
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
      throw new UnauthorizedException('Facebook token verification failed');
    }
  }

  /**
   * Verify token dựa trên platform
   */
  async verifyToken(platform: 'google' | 'facebook', accessToken: string): Promise<VerifiedUserData> {
    switch (platform) {
      case 'google':
        return this.verifyGoogleToken(accessToken);
      case 'facebook':
        return this.verifyFacebookToken(accessToken);
      default:
        throw new UnauthorizedException('Unsupported platform');
    }
  }
}
