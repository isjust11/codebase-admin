import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-facebook';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../../services/auth.service';

@Injectable()
export class FacebookStrategy extends PassportStrategy(Strategy, 'facebook') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('FACEBOOK_APP_ID') || '',
      clientSecret: configService.get<string>('FACEBOOK_APP_SECRET') || '',
      callbackURL: configService.get<string>('FACEBOOK_CALLBACK_URL') || '',
      scope: 'email',
      profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    const user = {
      email: emails[0].value,
      fullName: `${name.givenName} ${name.middleName ?? ''} ${name.familyName}`,
      picture: photos[0].value,
      platformId: id,
      isFacebookUser: true,
      accessToken,
    };

    const validatedUser = await this.authService.validateSocialUser(user);
    return validatedUser;
  }
} 