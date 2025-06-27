import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserService } from '../services/user.service';
import { JwtPayload } from '../dtos/auth.dto';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  
  constructor(private userService: UserService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'AyTUug0rjLJrLF5FJOdyaVdNkaZgugvp',
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.userService.findById(payload.sub);
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    return payload;
  }
} 