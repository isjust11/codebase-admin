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
import { MultiImageService } from 'src/services/multi-image.service';
import { HerbalImageType, ImageEntityType } from '../../entities/multi-image.entity';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { MultiImageDto, MultiImageResponseDto, SortOrderDto } from '../../dtos/multi-image.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';

@Controller('herbal-images')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MultiImageController extends BaseController {
  constructor(private readonly multiImageService: MultiImageService) {
    super()
  }

  @Post()
  @RequirePermission('CREATE', 'herbal-image')
  async create(@Body() createHerbalImageDto: MultiImageDto): Promise<MultiImageResponseDto> {
    const herbalImage = await this.multiImageService.create(createHerbalImageDto);
    return plainToClass(MultiImageResponseDto, herbalImage);
  }

  @Get()
  @RequirePermission('READ', 'herbal-image')
  async findAll(): Promise<MultiImageResponseDto[]> {
    const herbalImages = await this.multiImageService.findAll();
    return plainToClass(MultiImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId')
  @RequirePermission('READ', 'herbal-image')
  async findByHerbalId(@Param('herbalId') herbalId: string): Promise<MultiImageResponseDto[]> {
    const herbalImages = await this.multiImageService.findByHerbalId(this.decode(herbalId));
    return plainToClass(MultiImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByType(
    @Param('herbalId') herbalId: string,
    @Param('type') type: HerbalImageType,
  ): Promise<MultiImageResponseDto[]> {
    const herbalImages = await this.multiImageService.findByType(this.decode(herbalId), type);
    return plainToClass(MultiImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImage(@Param('herbalId') herbalId: string): Promise<MultiImageResponseDto | null> {
    const mainImage = await this.multiImageService.getMainImage(this.decode(herbalId));
    return mainImage ? plainToClass(MultiImageResponseDto, mainImage) : null;
  }

  @Get(':id')
  @RequirePermission('READ', 'herbal-image')
  async findOne(@Param('id') id: string): Promise<MultiImageResponseDto> {
    const herbalImage = await this.multiImageService.findOne(this.decode(id));
    return plainToClass(MultiImageResponseDto, herbalImage);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'herbal-image')
  async update(
    @Param('id') id: string,
    @Body() herbalImageDto: MultiImageDto,
  ): Promise<MultiImageResponseDto> {
    const herbalImage = await this.multiImageService.update(this.decode(id), herbalImageDto);
    return plainToClass(MultiImageResponseDto, herbalImage);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.multiImageService.remove(this.decode(id));
  }

  @Delete('herbal/:herbalId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByHerbalId(@Param('herbalId') herbalId: string): Promise<void> {
    await this.multiImageService.removeByHerbalId(this.decode(herbalId));
  }

  @Post('sort-order')
  @RequirePermission('UPDATE', 'herbal-image')
  @HttpCode(HttpStatus.OK)
  async updateSortOrder(@Body() images: SortOrderDto[]): Promise<void> {
    await this.multiImageService.updateSortOrder(images);
  }

  // Endpoints mới cho các entity khác
  @Get('entity/:entityType/:entityId')
  @RequirePermission('READ', 'herbal-image')
  async findByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<MultiImageResponseDto[]> {
    const images = await this.multiImageService.findByEntity(entityType, this.decode(entityId));
    return plainToClass(MultiImageResponseDto, images);
  }

  @Get('entity/:entityType/:entityId/type/:type')
  @RequirePermission('READ', 'herbal-image')
  async findByEntityAndType(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
    @Param('type') type: HerbalImageType,
  ): Promise<MultiImageResponseDto[]> {
    const images = await this.multiImageService.findByEntityAndType(entityType, this.decode(entityId), type);
    return plainToClass(MultiImageResponseDto, images);
  }

  @Get('entity/:entityType/:entityId/main')
  @RequirePermission('READ', 'herbal-image')
  async getMainImageByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<MultiImageResponseDto | null> {
    const mainImage = await this.multiImageService.getMainImageByEntity(entityType, this.decode(entityId));
    return mainImage ? plainToClass(MultiImageResponseDto, mainImage) : null;
  }

  @Delete('entity/:entityType/:entityId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByEntity(
    @Param('entityType') entityType: ImageEntityType,
    @Param('entityId') entityId: string,
  ): Promise<void> {
    await this.multiImageService.removeByEntity(entityType, this.decode(entityId));
  }

  // Endpoints tiện ích cho folk-medicine
  @Get('folk-medicine/:folkMedicineId')
  @RequirePermission('READ', 'herbal-image')
  async findByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string): Promise<MultiImageResponseDto[]> {
    const images = await this.multiImageService.findByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return plainToClass(MultiImageResponseDto, images);
  }

  @Get('folk-medicine/:folkMedicineId/main')
  @RequirePermission('READ', 'herbal-image')
  async getFolkMedicineMainImage(@Param('folkMedicineId') folkMedicineId: string): Promise<MultiImageResponseDto | null> {
    const mainImage = await this.multiImageService.getMainImageByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
    return mainImage ? plainToClass(MultiImageResponseDto, mainImage) : null;
  }

  @Delete('folk-medicine/:folkMedicineId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByFolkMedicineId(@Param('folkMedicineId') folkMedicineId: string): Promise<void> {
    await this.multiImageService.removeByEntity(ImageEntityType.FOLK_MEDICINE, this.decode(folkMedicineId));
  }

  // Endpoints tiện ích cho disease
  @Get('disease/:diseaseId')
  @RequirePermission('READ', 'herbal-image')
  async findByDiseaseId(@Param('diseaseId') diseaseId: string): Promise<MultiImageResponseDto[]> {
    const images = await this.multiImageService.findByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return plainToClass(MultiImageResponseDto, images);
  }

  @Get('disease/:diseaseId/main')
  @RequirePermission('READ', 'herbal-image')
  async getDiseaseMainImage(@Param('diseaseId') diseaseId: string): Promise<MultiImageResponseDto | null> {
    const mainImage = await this.multiImageService.getMainImageByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
    return mainImage ? plainToClass(MultiImageResponseDto, mainImage) : null;
  }

  @Delete('disease/:diseaseId')
  @RequirePermission('DELETE', 'herbal-image')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByDiseaseId(@Param('diseaseId') diseaseId: string): Promise<void> {
    await this.multiImageService.removeByEntity(ImageEntityType.DISEASE, this.decode(diseaseId));
  }
} 