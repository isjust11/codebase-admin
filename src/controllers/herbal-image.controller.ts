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
import { CreateHerbalImageDto, UpdateHerbalImageDto, HerbalImageResponseDto, SortOrderDto } from '../dtos/herbal-image.dto';

@Controller('herbal-images')
export class HerbalImageController {
  constructor(private readonly herbalImageService: HerbalImageService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createHerbalImageDto: CreateHerbalImageDto): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.create(createHerbalImageDto);
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Get()
  async findAll(): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findAll();
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId')
  async findByHerbalId(@Param('herbalId') herbalId: string): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findByHerbalId(+herbalId);
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/type/:type')
  async findByType(
    @Param('herbalId') herbalId: string,
    @Param('type') type: HerbalImageType,
  ): Promise<HerbalImageResponseDto[]> {
    const herbalImages = await this.herbalImageService.findByType(+herbalId, type);
    return plainToClass(HerbalImageResponseDto, herbalImages);
  }

  @Get('herbal/:herbalId/main')
  async getMainImage(@Param('herbalId') herbalId: string): Promise<HerbalImageResponseDto | null> {
    const mainImage = await this.herbalImageService.getMainImage(+herbalId);
    return mainImage ? plainToClass(HerbalImageResponseDto, mainImage) : null;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.findOne(+id);
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateHerbalImageDto: UpdateHerbalImageDto,
  ): Promise<HerbalImageResponseDto> {
    const herbalImage = await this.herbalImageService.update(+id, updateHerbalImageDto);
    return plainToClass(HerbalImageResponseDto, herbalImage);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.herbalImageService.remove(+id);
  }

  @Delete('herbal/:herbalId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeByHerbalId(@Param('herbalId') herbalId: string): Promise<void> {
    await this.herbalImageService.removeByHerbalId(+herbalId);
  }

  @Post('sort-order')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateSortOrder(@Body() images: SortOrderDto[]): Promise<void> {
    await this.herbalImageService.updateSortOrder(images);
  }
} 