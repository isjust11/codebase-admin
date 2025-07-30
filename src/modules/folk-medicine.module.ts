import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { FolkMedicineService } from '../services/folk-medicine.service';
import { FolkMedicineController } from '../controllers/folk-medicine.controller';
import { Permission } from 'src/entities/permission.entity';
import { Feature } from 'src/entities/feature.entity';
import { RoleService } from 'src/services/role.service';
import { Role } from 'src/entities/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([FolkMedicine,Role, User, Category, Permission, Feature]),
  ],
  controllers: [FolkMedicineController],
  providers: [FolkMedicineService, RoleService],
  exports: [FolkMedicineService],
})
export class FolkMedicineModule {} 