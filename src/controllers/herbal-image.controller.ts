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
import { HerbalImageService } from '../services/herbal-image.service';
import { HerbalImage, HerbalImageType } from '../entities/herbal-image.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { plainToClass } from 'class-transformer';
import { HerbalImageDto, HerbalImageResponseDto, SortOrderDto } from '../dtos/herbal-image.dto';
import { BaseController } from './base.controller';
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
} 