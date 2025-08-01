import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { HerbalService } from '../services/herbal.service';
import { Herbal } from '../entities/herbal.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaginationParams } from '../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CreateHerbalDto, UpdateHerbalDto, HerbalResponseDto } from '../dtos/herbal.dto';

@Controller('herbals')
export class HerbalController {
  constructor(private readonly herbalService: HerbalService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createHerbalDto: CreateHerbalDto): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.create(createHerbalDto);
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Get()
  async findAll(@Query() query: PaginationParams): Promise<any> {
    if (query.page || query.size || query.search) {
      return this.herbalService.findPagination(query);
    }
    const herbals = await this.herbalService.findAll();
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get('category/:categoryId')
  async findByCategory(@Param('categoryId') categoryId: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByCategory(categoryId);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get('scientific-name/:scientificName')
  async findByScientificName(@Param('scientificName') scientificName: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByScientificName(scientificName);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get('family/:family')
  async findByFamily(@Param('family') family: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByFamily(family);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.findOne(+id);
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateHerbalDto: UpdateHerbalDto,
  ): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.update(+id, updateHerbalDto);
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.herbalService.remove(+id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    await this.herbalService.incrementViewCount(+id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string): Promise<void> {
    await this.herbalService.incrementLikeCount(+id);
  }
} 