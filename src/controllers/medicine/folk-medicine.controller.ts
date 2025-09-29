import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Res } from '@nestjs/common';
import { FolkMedicineService } from '../../services/folk-medicine.service';
import { FolkMedicineDto } from '../../dtos/folk-medicine.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';
@Controller('folk-medicine')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FolkMedicineController extends BaseController {
  constructor(private readonly folkMedicineService: FolkMedicineService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'folk-medicine')
  create(@Body() dto: FolkMedicineDto) {
    return this.folkMedicineService.create(dto);
  }

  @Get()
  @RequirePermission('READ', 'folk-medicine')
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('categoryId') categoryId: string,
    @Res() res: Response,
  ) {
    try {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
      categoryId: categoryId || '',
    };
      const data = await this.folkMedicineService.findPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
  

  @Get('all')
  @RequirePermission('READ', 'folk-medicine')
  findAll(@Res() res: Response) {
    try {
      const data = this.folkMedicineService.findAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'folk-medicine')
  findByCategory(@Param('categoryId') categoryId: string, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.findByCategory(this.decode(categoryId));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'folk-medicine')
  findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'folk-medicine')
  update(@Param('id') id: number, @Body() dto: FolkMedicineDto, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.update(id, dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'folk-medicine')
  remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/view')
  @RequirePermission('READ', 'folk-medicine')
  incrementViewCount(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.incrementViewCount(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/like')
  @RequirePermission('READ', 'folk-medicine')
  incrementLikeCount(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = this.folkMedicineService.incrementLikeCount(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 