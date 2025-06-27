import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { CategoryTypeService } from '../services/category-type.service';
import { CategoryType } from '../entities/category-type.entity';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('category-types')
export class CategoryTypeController {
  constructor(private readonly categoryTypeService: CategoryTypeService) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.categoryTypeService.findAllWithPagination(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<CategoryType | null> {
    return this.categoryTypeService.findOne(id);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string): Promise<CategoryType | null> {
    return this.categoryTypeService.findByCode(code);
  }

  @Post()
  async create(@Body() categoryType: CategoryType): Promise<CategoryType> {
    return this.categoryTypeService.create(categoryType);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() categoryType: CategoryType,
  ): Promise<CategoryType | null> {
    return this.categoryTypeService.update(id, categoryType);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.categoryTypeService.remove(id);
  }
} 