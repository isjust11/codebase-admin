import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HerbalController } from '../controllers/medicine/herbal.controller';
import { HerbalService } from '../services/herbal.service';
import { MultiImageController } from '../controllers/medicine/multi-image.controller';
import { MultiImageService } from '../services/multi-image.service';
import { Herbal } from '../entities/herbal.entity';
import { MultiImage } from '../entities/multi-image.entity';
import { AuthModule } from './auth.module';
import { CategoryModule } from './category.module';
import { FolkMedicine } from '../entities/folk-medicine.entity';
import { FolkMedicineController } from '../controllers/medicine/folk-medicine.controller';
import { FolkMedicineService } from '../services/folk-medicine.service';
import { Author } from '../entities/author.entity';
import { AuthorService } from '../services/author.service';
import { AuthorController } from 'src/controllers/medicine/author.controller';
import { DataSourceController } from 'src/controllers/media/data-source.controller';
import { DataSourceService } from 'src/services/data-source.service';
import { DataSource } from 'src/entities/data-source.entity';
import { FolkMedicineIngredient } from '../entities/folk-medicine-ingredient.entity';
import { Disease } from '../entities/disease.entity';
import { DiseaseService } from '../services/disease.service';
import { DiseaseController } from '../controllers/medicine/disease.controller';
import { MediaModule } from './media.module';

@Module({
  imports: [
    AuthModule,
    CategoryModule, 
    MediaModule,
    TypeOrmModule.forFeature([
      Herbal, 
      MultiImage, 
      FolkMedicine, 
      FolkMedicineIngredient,
      Author,
      DataSource,
      Disease,
    ])
  ],
  controllers: [
    HerbalController, 
    MultiImageController, 
    FolkMedicineController, 
    AuthorController,
    DataSourceController,
    DiseaseController
  ],
  providers: [
    HerbalService, 
    MultiImageService, 
    FolkMedicineService, 
    AuthorService,
    DataSourceService,
    DiseaseService
  ],
  exports: [
    HerbalService, 
    MultiImageService, 
    FolkMedicineService, 
    AuthorService,
    DataSourceService,
    DiseaseService
  ],
})
export class MedicineModule {} 