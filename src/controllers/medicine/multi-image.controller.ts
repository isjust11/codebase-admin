import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
  Res,
} from '@nestjs/common';
import { MultiImageService } from 'src/services/multi-image.service';
import { HerbalImageType, ImageEntityType } from '../../entities/multi-image.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { MultiImageDto, MultiImageResponseDto, SortOrderDto } from '../../dtos/multi-image.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { Response } from 'express';

@Controller('herbal-images')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MultiImageController extends BaseController {
  constructor(private readonly multiImageService: MultiImageService) {
    super()
  }

  @Post()
  @RequirePermission('CREATE', 'herbal-image')
  async create(@Body() createHerbalImageDto: MultiImageDto,
   @Res() res: Response) {
  try {
      const herbalImage = await this.multiImageService.create(createHerbalImageDto);
      return this.success(res, herbalImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'herbal-image')
  async findAll(@Res() res: Response) {
    try {
      const herbalImages = await this.multiImageService.findAll();
      return this.success(res, herbalImages);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('herbal/:herbalId')
  @RequirePermission('READ', 'herbal-image')
  async findByHerbalId(@Param('herbalId') herbalId: string, @Res() res: Response) {
    try {
      const herbalImages = await this.multiImageService.findByHerbalId(this.decode(herbalId));
      return this.success(res, herbalImages);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('herbal/:herbalId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByType(@Param('herbalId') herbalId: string, @Param('type') type: HerbalImageType, @Res() res: Response) {
    try {
      const herbalImages = await this.multiImageService.findByType(this.decode(herbalId), type);
      return this.success(res, herbalImages);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('herbal/:herbalId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImage(@Param('herbalId') herbalId: string, @Res() res: Response) {
    try {
    const mainImage = await this.multiImageService.getMainImage(this.decode(herbalId));
      return this.success(res, mainImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'herbal-image')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
    const herbalImage = await this.multiImageService.findOne(this.decode(id));
      return this.success(res, herbalImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'herbal-image')
  async update(
    @Param('id') id: string,
    @Body() herbalImageDto: MultiImageDto,
    @Res() res: Response) {
    try {
    const herbalImage = await this.multiImageService.update(this.decode(id), herbalImageDto);
      return this.success(res, herbalImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
    await this.multiImageService.remove(this.decode(id));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('herbal/:herbalId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByHerbalId(@Param('herbalId') herbalId: string, @Res() res: Response) {
    try {
    await this.multiImageService.removeByHerbalId(this.decode(herbalId));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('sort-order')
  @RequirePermission('UPDATE', 'herbal-image')
  @HttpCode(HttpStatus.OK)
  async updateSortOrder(@Body() images: SortOrderDto[], @Res() res: Response) {
    try {
    await this.multiImageService.updateSortOrder(images);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // Endpoints mới cho các entity khác
  @Get('entity/:entityType/:entityId')
  @RequirePermission('READ', 'herbal-image')
  async findByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Res() res: Response) {
    try {
    const images = await this.multiImageService.findByEntity(entityType, this.decode(entityId));
      return this.success(res, images);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('entity/:entityType/:entityId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByEntityAndType(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Param('type') type: HerbalImageType,
    @Res() res: Response) {
    try {
    const images = await this.multiImageService.findByEntityAndType(entityType, this.decode(entityId), type);
    return this.success(res, images);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('entity/:entityType/:entityId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImageByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Res() res: Response) {
    try {
    const mainImage = await this.multiImageService.getMainImageByEntity(entityType, this.decode(entityId));
    return this.success(res, mainImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('entity/:entityType/:entityId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Res() res: Response) {
    try {
    await this.multiImageService.removeByEntity(entityType, this.decode(entityId));
    } catch (error) {
      return this.error(res, error);
    }
  }

  // Endpoints tiện ích cho folk-medicine
  @Get('folk-medicine/:folkMedicineId')
  @RequirePermission('READ', 'herbal-image')
  async findByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string, @Res() res: Response) {
    try {
    const images = await this.multiImageService.findByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return this.success(res, images);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('folk-medicine/:folkMedicineId/main')
  @RequirePermission('READ', 'herbal-image')
  async getFolkMedicineMainImage(@Param('folkMedicineId') folkMedicineId: string, @Res() res: Response) {
    try {
    const mainImage = await this.multiImageService.getMainImageByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return this.success(res, mainImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('folk-medicine/:folkMedicineId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string, @Res() res: Response) {
    try {
    await this.multiImageService.removeByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    } catch (error) {
      return this.error(res, error);
    }
  }

  // Endpoints tiện ích cho disease
  @Get('disease/:diseaseId')
  @RequirePermission('READ', 'herbal-image')
  async findByDiseaseId(@Param('diseaseId') diseaseId: string, @Res() res: Response) {
    try {
    const images = await this.multiImageService.findByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return this.success(res, images);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('disease/:diseaseId/main')
  @RequirePermission('READ', 'herbal-image')
  async getDiseaseMainImage(@Param('diseaseId') diseaseId: string, @Res() res: Response) {
    try {
    const mainImage = await this.multiImageService.getMainImageByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return this.success(res, mainImage);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('disease/:diseaseId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByDiseaseId(@Param('diseaseId') diseaseId: string, @Res() res: Response) {
    try {
    await this.multiImageService.removeByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    } catch (error) {
      return this.error(res, error);
    }
  }
} 