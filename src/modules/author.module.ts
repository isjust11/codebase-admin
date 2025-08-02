import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthorController } from '../controllers/author.controller';
import { AuthorService } from '../services/author.service';
import { Author } from '../entities/author.entity';
import { Role } from 'src/entities/role.entity';
import { Permission } from 'src/entities/permission.entity';
import { RoleService } from 'src/services/role.service';
import { PermissionService } from 'src/services/permission.service';
import { Feature } from 'src/entities/feature.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Author, Role, Permission, Feature])],
  controllers: [AuthorController],
  providers: [AuthorService, RoleService, PermissionService],
  exports: [AuthorService],
})
export class AuthorModule {} 