import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Res } from '@nestjs/common';
import { CategoryTypeService } from '../../services/category-type.service';
import { CategoryType } from '../../entities/category-type.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('category-types')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryTypeController extends BaseController {
  constructor(private readonly categoryTypeService: CategoryTypeService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'category-type')
  async getByPagination(@Query('page') page: number,
    @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    try {
      const data = await this.categoryTypeService.findAllWithPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('all')
  @RequirePermission('READ', 'category-type')
  async getAll(@Res() res: Response) {
    try {
      const data = await this.categoryTypeService.findAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('article')
  @RequirePermission('READ', 'category-type')
  async getArticle(@Res() res: Response) {
    try {
      const data = await this.categoryTypeService.findArticleType();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'category-type')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.categoryTypeService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('parent/:parentId')
  @RequirePermission('READ', 'category-type')
  async findByParent(@Param('parentId') parentId: string, @Res() res: Response) {
    try {
      const id = this.decode(parentId);
      const data = await this.categoryTypeService.findByParent(id);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }


  @Get('code/:code')
  @RequirePermission('READ', 'category-type')
  async findByCode(@Param('code') code: string, @Res() res: Response) {
    try {
      const data = await this.categoryTypeService.findByCode(code);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'category-type')
  async create(@Body() categoryType: CategoryType, @Res() res: Response) {
    try {
      const data = await this.categoryTypeService.create(categoryType);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'category-type')
  async update(
    @Param('id') id: string,
    @Body() categoryType: CategoryType,
    @Res() res: Response
  ) {
    try {
      const data = await this.categoryTypeService.update(this.decode(id), categoryType);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'category-type')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.categoryTypeService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 