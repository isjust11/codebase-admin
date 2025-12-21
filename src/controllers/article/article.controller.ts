import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Request, Res } from '@nestjs/common';
import { ArticleService } from 'src/services/article.service';
import { ArticleDto } from '../../dtos/article.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';

@Controller('article')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ArticleController extends BaseController {
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
    @Request() req,
    @Res() res: Response,
    @Query('articleCode') articleCode?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    try {
      const categoryIdDecoded = categoryId ? this.decode(categoryId) : undefined;
      const data = await this.articleService.
      findPagination(filter, req.user?.id, articleCode, categoryIdDecoded);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // get featured news list
  @Get('featured')
  @RequirePermission('READ', 'article')
  async getFeaturedList(@Res() res: Response) {
    try {
      const data = await this.articleService.getFeaturedList();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // get recomment news list
  @Get('recommend')
  @RequirePermission('READ', 'article')
  async getRecommendList(@Query('searchData') searchData: string, @Res() res: Response) {
    try {
      const data = await this.articleService.getRecommendList(searchData);
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

  @Get('discovery/:categoryId')
  @RequirePermission('READ', 'article')
  async findDiscovery(
    @Param('categoryId') categoryId: string,
      @Query('page') page: number,
      @Query('size') size: number,
      @Query('search') search: string,
    @Request() req,
    @Res() res: Response) {
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
      };
      const data = await this.articleService.findByDiscovery(filter, this.decode(categoryId));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // get tip list
  @Get('tips')
  @RequirePermission('READ', 'article')
  async getTipList(@Query('page') page: number,
  @Query('size') size: number,
  @Query('search') search: string,
  @Query('categoryId') categoryId: string,
  @Res() res: Response) {
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
        categoryId: categoryId || '',
      };
      const data = await this.articleService.getTipList(filter, this.decode(categoryId));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
  // get tip details
  @Get('tips/:id')
  @RequirePermission('READ', 'article')
  async getTipDetails(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.articleService.getTipDetails(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'article')
  async findOne(@Param('id') id: string, @Request() req, @Res() res: Response) {
    try {
      const data = await this.articleService.findOne(this.decode(id), req.user?.id);
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

  @Get('trending')
  async getTrendingList(@Query() params: PaginationParams, @Res() res: Response) {
    try {
      const data = await this.articleService.getTrendingList(params);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('favorites')
  async getFavoritesList(@Query() params: PaginationParams, @Res() res: Response) {
    try {
      const data = await this.articleService.getFavoritesList(params);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('recent')
  async getRecentList(@Query() params: PaginationParams, @Res() res: Response) {
    try {
      const data = await this.articleService.getRecentList(params);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('bookmarks')
  async getBookmarkedList(@Query() params: PaginationParams, @Res() res: Response) {
    try {
      const data = await this.articleService.getBookmarkedList(params);
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