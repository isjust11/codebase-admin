import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentController } from '../controllers/payment.controller';
import { PaymentService } from '../services/payment.service';
import { Payment } from '../entities/payment.entity';
import { User } from '../entities/user.entity';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, User, Role, Feature, Permission]),
    ConfigModule,
  ],
  controllers: [PaymentController],
  providers: [PaymentService, RoleService],
  exports: [PaymentService],
})
export class PaymentModule {} 