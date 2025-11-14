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
} from '@nestjs/common';
import { HerbalImageService } from '../../services/herbal-image.service';
import { HerbalImageType, ImageEntityType } from '../../entities/multi-image.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { HerbalImageDto, HerbalImageResponseDto, SortOrderDto } from '../../dtos/multi-image.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('herbal-images')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HerbalImageController extends BaseController {
  constructor(private readonly herbalImageService: HerbalImageService) {
    super()
  }

  @Post()
  @RequirePermission('CREATE', 'herbal-image')
  async create(@Body() createHerbalImageDto: HerbalImageDto): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.create(createHerbalImageDto);
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Get()
  @RequirePermission('READ', 'herbal-image')
  async findAll(): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findAll();
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId')
  @RequirePermission('READ', 'herbal-image')
  async findByHerbalId(@Param('herbalId') herbalId: string): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findByHerbalId(this.decode(herbalId));
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByType(
    @Param('herbalId') herbalId: string,
    @Param('type') type: HerbalImageType,
  ): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findByType(this.decode(herbalId), type);
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImage(@Param('herbalId') herbalId: string): Promise<HerbalImageResponseDto | null> {
    const mainImage = await this.herbalImageService.getMainImage(this.decode(herbalId));
    return mainImage ? plainToClass(HerbalImageResponseDto, mainImage) : null;
  }

  @Get(':id')
  @RequirePermission('READ', 'herbal-image')
  async findOne(@Param('id') id: string): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.findOne(this.decode(id));
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'herbal-image')
  async update(
    @Param('id') id: string,
    @Body() herbalImageDto: HerbalImageDto,
  ): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.update(this.decode(id), herbalImageDto);
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.herbalImageService.remove(this.decode(id));
  }

  @Delete('herbal/:herbalId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByHerbalId(@Param('herbalId') herbalId: string): Promise<void> {
    await this.herbalImageService.removeByHerbalId(this.decode(herbalId));
  }

  @Post('sort-order')
  @RequirePermission('UPDATE', 'herbal-image')
  @HttpCode(HttpStatus.OK)
  async updateSortOrder(@Body() images: SortOrderDto[]): Promise<void> {
    await this.herbalImageService.updateSortOrder(images);
  }

  // Endpoints mới cho các entity khác
  @Get('entity/:entityType/:entityId')
  @RequirePermission('READ', 'herbal-image')
  async findByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<HerbalImageResponseDto[]> {
    const images = await this.herbalImageService.findByEntity(entityType, this.decode(entityId));
    return plainToClass(HerbalImageResponseDto, images);
  }

  @Get('entity/:entityType/:entityId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByEntityAndType(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Param('type') type: HerbalImageType,
  ): Promise<HerbalImageResponseDto[]> {
    const images = await this.herbalImageService.findByEntityAndType(entityType, this.decode(entityId), type);
    return plainToClass(HerbalImageResponseDto, images);
  }

  @Get('entity/:entityType/:entityId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImageByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<HerbalImageResponseDto | null> {
    const mainImage = await this.herbalImageService.getMainImageByEntity(entityType, this.decode(entityId));
    return mainImage ? plainToClass(HerbalImageResponseDto, mainImage) : null;
  }

  @Delete('entity/:entityType/:entityId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<void> {
    await this.herbalImageService.removeByEntity(entityType, this.decode(entityId));
  }

  // Endpoints tiện ích cho folk-medicine
  @Get('folk-medicine/:folkMedicineId')
  @RequirePermission('READ', 'herbal-image')
  async findByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string): Promise<HerbalImageResponseDto[]> {
    const images = await this.herbalImageService.findByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return plainToClass(HerbalImageResponseDto, images);
  }

  @Get('folk-medicine/:folkMedicineId/main')
  @RequirePermission('READ', 'herbal-image')
  async getFolkMedicineMainImage(@Param('folkMedicineId') folkMedicineId: string): Promise<HerbalImageResponseDto | null> {
    const mainImage = await this.herbalImageService.getMainImageByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return mainImage ? plainToClass(HerbalImageResponseDto, mainImage) : null;
  }

  @Delete('folk-medicine/:folkMedicineId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string): Promise<void> {
    await this.herbalImageService.removeByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
  }

  // Endpoints tiện ích cho disease
  @Get('disease/:diseaseId')
  @RequirePermission('READ', 'herbal-image')
  async findByDiseaseId(@Param('diseaseId') diseaseId: string): Promise<HerbalImageResponseDto[]> {
    const images = await this.herbalImageService.findByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return plainToClass(HerbalImageResponseDto, images);
  }

  @Get('disease/:diseaseId/main')
  @RequirePermission('READ', 'herbal-image')
  async getDiseaseMainImage(@Param('diseaseId') diseaseId: string): Promise<HerbalImageResponseDto | null> {
    const mainImage = await this.herbalImageService.getMainImageByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return mainImage ? plainToClass(HerbalImageResponseDto, mainImage) : null;
  }

  @Delete('disease/:diseaseId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByDiseaseId(@Param('diseaseId') diseaseId: string): Promise<void> {
    await this.herbalImageService.removeByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
  }
} 