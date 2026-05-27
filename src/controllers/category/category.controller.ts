import { Controller, Get, Post, Body, Param, Put, Delete, Request, Query, UseGuards, Res, ClassSerializerInterceptor, UseInterceptors } from '@nestjs/common';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../entities/category.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('categories')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryController extends BaseController {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'category')
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    try {
      const data = await this.categoryService.findAllWithPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('get-by-category-type/:categoryTypeCode')
  @RequirePermission('READ', 'category')
  async getByCategoryType(
    @Param('categoryTypeCode') categoryTypeCode: string,
    @Query('sortBy') sortBy: string,
    @Query('sortType') sortType: 'ASC' | 'DESC',
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const categories = await this.categoryService.findByCategoryTypeCode(categoryTypeCode, sortBy, sortType, locale);
      return this.success(res as any, categories);
    } catch (error) {
      return this.error(res as any, error);
    }
  }

  @Get('get-tree-by-category-type/:categoryTypeCode')
  @RequirePermission('READ', 'category')
  async getTreeByCategoryType(
    @Param('categoryTypeCode') categoryTypeCode: string,
    @Query('sortBy') sortBy: string,
    @Query('sortType') sortType: 'ASC' | 'DESC',
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const categories = await this.categoryService.findTreeByCategoryTypeCode(categoryTypeCode, sortBy, sortType, locale);
      return this.success(res as any, categories);
    } catch (error) {
      return this.error(res as any, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'category')
  async findAll(@Res() res: Response) {
    try {
      const data = await this.categoryService.findAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'category')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.categoryService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'category')
  async create(@Body() category: Category, @Request() req, @Res() res: Response) {
    category.createdAt = new Date();
    category.createBy = req?.user?.id; // Assuming req.user.id contains the ID of the user creating the category
    category.categoryTypeId = this.decode(category.categoryTypeId.toString());
    if (category.parentId) {
      category.parentId = this.decode(category.parentId.toString());
    }
    try {
      const data = await this.categoryService.create(category);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'category')
  async update(@Param('id') id: string, @Body() category: Category, @Res() res: Response) {
    category.categoryTypeId = this.decode(category.categoryTypeId.toString());
    if (category.parentId) {
      category.parentId = this.decode(category.parentId.toString());
    }
    try {
      const data = await this.categoryService.update(this.decode(id), category);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put('update-status/:id')
  @RequirePermission('UPDATE', 'category')
  async updateStatus(@Param('id') id: string, @Body() category: Category, @Res() res: Response) {
    try {
      const data = await this.categoryService.updateStatus(this.decode(id), category);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'category')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.categoryService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}