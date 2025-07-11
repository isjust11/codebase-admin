import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserExam } from '../entities/user-exam.entity';
import { UserExamService } from '../services/user-exam.service';
import { UserExamController } from '../controllers/user-exam.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Exam } from '../entities/exam.entity';
import { User } from '../entities/user.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserExam, Role, Exam, User, Feature, Permission])],
  providers: [UserExamService, RoleService],
  controllers: [UserExamController],
  exports: [UserExamService],
})
export class UserExamModule {} 