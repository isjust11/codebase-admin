import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InviteEffectController } from 'src/controllers/invite-effect/invite-effect.controller';
import { PublicInviteEffectController } from 'src/controllers/invite-effect/public-invite-effect.controller';
import { InviteEffect } from 'src/entities/invite-effect.entity';
import { InviteEffectService } from 'src/services/invite-effect.service';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([InviteEffect])],
  providers: [InviteEffectService],
  controllers: [InviteEffectController, PublicInviteEffectController],
  exports: [InviteEffectService],
})
export class InviteEffectModule {}
