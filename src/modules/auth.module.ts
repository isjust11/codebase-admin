import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';
import { Guest } from 'src/entities/guest.entity';
import { User } from 'src/entities/user.entity';
import { Media } from 'src/entities/media.entity';
import { RefreshToken } from 'src/entities/refresh-token.entity';
import { UserController } from 'src/controllers/auth/user.controller';
import { UserService } from 'src/services/user.service';
import { FeatureController } from 'src/controllers/auth/feature.controller';
import { FeatureService } from 'src/services/feature.service';
import { PermissionController } from 'src/controllers/auth/permission.controller';
import { RoleController } from 'src/controllers/auth/role.controller';
import { PermissionService } from 'src/services/permission.service';
import { AuthController } from 'src/controllers/auth/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { EmailService } from 'src/services/email.service';
import { FacebookStrategy } from 'src/guards/strategies/facebook.strategy';
import { JwtStrategy } from 'src/guards/jwt.strategy';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { GoogleStrategy } from 'src/guards/strategies/google.strategy';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    // ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'AyTUug0rjLJrLF5FJOdyaVdNkaZgugvp',
      signOptions: { expiresIn: '24h' },
    }),
    TypeOrmModule.forFeature([
      Feature,
      User,
      Guest,
      Media,
      Permission,
      Role,
      RefreshToken,
    ])],
  controllers: [
    AuthController, 
    UserController,
    FeatureController, 
    PermissionController, 
    RoleController
  ],
  providers: [
    UserService, 
    RoleService, 
    FeatureService, 
    PermissionService, 
    AuthService,
    EmailService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
  exports: [
    UserService, 
    FeatureService, 
    PermissionService, 
    RoleService, 
    AuthService, 
    EmailService,
  ],
})
export class AuthModule { } 