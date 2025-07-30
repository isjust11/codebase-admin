import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { User } from '../entities/user.entity';
import { Category } from '../entities/category.entity';
import { FolkMedicineService } from '../services/folk-medicine.service';
import { FolkMedicineController } from '../controllers/folk-medicine.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([FolkMedicine, User, Category]),
  ],
  controllers: [FolkMedicineController],
  providers: [FolkMedicineService],
  exports: [FolkMedicineService],
})
export class FolkMedicineModule {} 