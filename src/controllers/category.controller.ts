import { Controller, Get, Post, Body, Param, Put, Delete, Request, Query, UseGuards } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { Category } from '../entities/category.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryController extends BaseController{
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'category')
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string){
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.categoryService.findAllWithPagination(filter);
  }

  @Get()
  @RequirePermission('READ', 'category')
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'category')
  async findOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoryService.findOne(id);
  }

  @Post()
  @RequirePermission('CREATE', 'category')
  async create(@Body() category: Category, @Request() req): Promise<Category | null> {
    category.createdAt = new Date();
    category.createBy = req?.user?.id; // Assuming req.user.id contains the ID of the user creating the category
    return this.categoryService.create(category);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'category')
  async update(@Param('id') id: string, @Body() category: Category): Promise<Category | null> {
    return this.categoryService.update(id, category);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'category')
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
} 