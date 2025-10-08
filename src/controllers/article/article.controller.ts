import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ArticleService } from '../../services/article.service';
import { ArticleDto } from '../../dtos/article.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('article')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ArticleController extends BaseController{
  constructor(private readonly articleService: ArticleService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'article')
  async create(@Body() dto: ArticleDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.articleService.create({
      ...dto,
        createdBy: req.user.id,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'article')
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Res() res: Response,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    try {
      const data = await this.articleService.findPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }


  @Get('all')
  @RequirePermission('READ', 'article')
  async findAll(@Res() res: Response) {
    try {
      const data = await this.articleService.findAll();
      return this.success(res, data); 
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'article')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.articleService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'article')
  async update(@Param('id') id: string, @Body() dto: ArticleDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.articleService.update(this.decode(id), {
      ...dto, 
        updatedBy: req.user.id,
      });
      return this.success(res, data);
    } catch (error) { 
      return this.error(res, error);
    }
  }

  // view and like
  @Post('view/:id')
  @RequirePermission('UPDATE', 'article')
  async updateView(@Param('id') id: string, @Body() dto: ArticleDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.articleService.updateView(this.decode(id), {
        ...dto,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'article')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.articleService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 