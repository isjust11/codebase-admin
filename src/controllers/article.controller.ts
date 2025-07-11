import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { ArticleService } from '../services/article.service';
import { ArticleDto } from '../dtos/article.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('article')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ArticleController extends BaseController{
  constructor(private readonly articleService: ArticleService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'article')
  create(@Body() dto: ArticleDto) {
    return this.articleService.create(dto);
  }

  @Get()
  @RequirePermission('READ', 'article')
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    return this.articleService.findPagination(filter);
  }


  @Get('all')
  @RequirePermission('READ', 'article')
  findAll() {
    return this.articleService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'article')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(this.decode(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'article')
  update(@Param('id') id: string, @Body() dto: ArticleDto) {
    return this.articleService.update(this.decode(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'article')
  remove(@Param('id') id: string) {
    return this.articleService.remove(this.decode(id));
  }
} 