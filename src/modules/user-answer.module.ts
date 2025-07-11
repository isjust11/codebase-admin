import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAnswer } from '../entities/user-answer.entity';
import { UserAnswerService } from '../services/user-answer.service';
import { UserAnswerController } from '../controllers/user-answer.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserAnswer, Role, Feature, Permission ])],
  providers: [UserAnswerService, RoleService],
  controllers: [UserAnswerController],
  exports: [UserAnswerService],
})
export class UserAnswerModule {} 