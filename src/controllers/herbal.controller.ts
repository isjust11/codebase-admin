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
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaginationParams } from '../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CreateHerbalDto, UpdateHerbalDto, HerbalResponseDto } from '../dtos/herbal.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('herbals')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HerbalController extends BaseController {
  constructor(private readonly herbalService: HerbalService) {
    super()
  }

  @Get()
  @RequirePermission('READ', 'herbal')
  async findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.herbalService.findPagination(filter);
  }

  @Post()
  @RequirePermission('CREATE', 'herbal')
  async create(@Body() createHerbalDto: CreateHerbalDto): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.create(createHerbalDto);
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'herbal')
  async findByCategory(@Param('categoryId') categoryId: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByCategory(categoryId);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get('scientific-name/:scientificName')
  @RequirePermission('READ', 'herbal')
  async findByScientificName(@Param('scientificName') scientificName: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByScientificName(scientificName);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get('family/:family')
  @RequirePermission('READ', 'herbal')
  async findByFamily(@Param('family') family: string): Promise<HerbalResponseDto[]> {
    const herbals = await this.herbalService.findByFamily(family);
    return plainToClass(HerbalResponseDto, herbals);
  }

  @Get(':id')
  @RequirePermission('READ', 'herbal')
  async findOne(@Param('id') id: string): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.findOne(this.decode(id));
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'herbal')
  async update(
    @Param('id') id: string,
    @Body() updateHerbalDto: UpdateHerbalDto,
  ): Promise<HerbalResponseDto> {
    const herbal = await this.herbalService.update(this.decode(id), updateHerbalDto);
    return plainToClass(HerbalResponseDto, herbal);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'herbal')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.herbalService.remove(this.decode(id));
  }

  @Post(':id/view')
  @RequirePermission('UPDATE', 'herbal')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    await this.herbalService.incrementViewCount(this.decode(id));
  }

  @Post(':id/like')
  @RequirePermission('UPDATE', 'herbal')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string): Promise<void> {
    await this.herbalService.incrementLikeCount(this.decode(id));
  }
} 