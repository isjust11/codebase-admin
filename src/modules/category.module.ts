import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoryController } from '../controllers/category.controller';
import { CategoryTypeController } from '../controllers/category-type.controller';
import { CategoryService } from '../services/category.service';
import { CategoryTypeService } from '../services/category-type.service';
import { Category } from '../entities/category.entity';
import { CategoryType } from '../entities/category-type.entity';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';
import { Feature } from '../entities/feature.entity';
import { Permission } from '../entities/permission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Category, CategoryType, Role, Feature, Permission])],
  controllers: [CategoryController, CategoryTypeController],
  providers: [CategoryService, CategoryTypeService, RoleService],
  exports: [CategoryService, CategoryTypeService],
})
export class CategoryModule {} 