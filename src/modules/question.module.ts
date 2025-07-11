import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../entities/question.entity';
import { QuestionService } from '../services/question.service';
import { QuestionController } from '../controllers/question.controller';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Feature } from '../entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question, Role, Permission, Feature])],
  providers: [QuestionService, RoleService],
  controllers: [QuestionController],
  exports: [QuestionService],
})
export class QuestionModule {} 