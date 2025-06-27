import { Controller, Get, Post, Body, Param, Put, Delete, Request, Query } from '@nestjs/common';
import { CategoryService } from '../services/category.service';
import { Category } from '../entities/category.entity';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string){
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.categoryService.findAllWithPagination(filter);
  }

  @Get()
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Category | null> {
    return this.categoryService.findOne(id);
  }

  @Post()
  async create(@Body() category: Category, @Request() req): Promise<Category | null> {
    category.createdAt = new Date();
    category.createBy = req?.user?.id; // Assuming req.user.id contains the ID of the user creating the category
    return this.categoryService.create(category);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() category: Category): Promise<Category | null> {
    return this.categoryService.update(id, category);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.categoryService.remove(id);
  }
} 