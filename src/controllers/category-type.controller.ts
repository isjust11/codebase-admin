import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { CategoryTypeService } from '../services/category-type.service';
import { CategoryType } from '../entities/category-type.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('category-types')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryTypeController extends BaseController{
  constructor(private readonly categoryTypeService: CategoryTypeService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'category-type')
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.categoryTypeService.findAllWithPagination(filter);
  }

  @Get(':id')
  @RequirePermission('READ', 'category-type')
  async findOne(@Param('id') id: string): Promise<CategoryType | null> {
    return this.categoryTypeService.findOne(id);
  }

  @Get('code/:code')
  @RequirePermission('READ', 'category-type')
  async findByCode(@Param('code') code: string): Promise<CategoryType | null> {
    return this.categoryTypeService.findByCode(code);
  }

  @Post()
  @RequirePermission('CREATE', 'category-type')
  async create(@Body() categoryType: CategoryType): Promise<CategoryType> {
    return this.categoryTypeService.create(categoryType);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'category-type')
  async update(
    @Param('id') id: string,
    @Body() categoryType: CategoryType,
  ): Promise<CategoryType | null> {
    return this.categoryTypeService.update(id, categoryType);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'category-type')
  async remove(@Param('id') id: string) {
    return this.categoryTypeService.remove(id);
  }
} 