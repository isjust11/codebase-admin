import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerbalController } from '../controllers/medicine/herbal.controller';
import { HerbalService } from '../services/herbal.service';
import { HerbalImageController } from '../controllers/medicine/herbal-image.controller';
import { HerbalImageService } from '../services/herbal-image.service';
import { Herbal } from '../entities/herbal.entity';
import { HerbalImage } from '../entities/herbal-image.entity';
import { AuthModule } from './auth.module';
import { CategoryModule } from './category.module';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { FolkMedicineController } from '../controllers/medicine/folk-medicine.controller';
import { FolkMedicineService } from '../services/folk-medicine.service';
import { Author } from '../entities/author.entity';
import { AuthorService } from '../services/author.service';
import { AuthorController } from 'src/controllers/medicine/author.controller';

@Module({
  imports: [
    AuthModule,
    CategoryModule, 
    TypeOrmModule.forFeature([
      Herbal, 
      HerbalImage, 
      FolkMedicine, 
      Author
    ])
  ],
  controllers: [
    HerbalController, 
    HerbalImageController, 
    FolkMedicineController, 
    AuthorController
  ],
  providers: [
    HerbalService, 
    HerbalImageService, 
    FolkMedicineService, 
    AuthorService
  ],
  exports: [
    HerbalService, 
    HerbalImageService, 
    FolkMedicineService, 
    AuthorService
  ],
})
export class MedicineModule {} 