import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards } from '@nestjs/common';
import { FolkMedicineService } from '../services/folk-medicine.service';
import { FolkMedicineDto } from '../dtos/folk-medicine.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

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
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
      categoryId: categoryId || '',
    };
    return this.folkMedicineService.findPagination(filter);
  }
  

  @Get('all')
  @RequirePermission('READ', 'folk-medicine')
  findAll() {
    return this.folkMedicineService.findAll();
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'folk-medicine')
  findByCategory(@Param('categoryId') categoryId: string) {
    const decodedCategoryId = this.decode(categoryId);
    return this.folkMedicineService.findByCategory(decodedCategoryId.toString());
  }

  @Get(':id')
  @RequirePermission('READ', 'folk-medicine')
  findOne(@Param('id') id: string) {
    return this.folkMedicineService.findOne(this.decode(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'folk-medicine')
  update(@Param('id') id: string, @Body() dto: FolkMedicineDto) {
    return this.folkMedicineService.update(this.decode(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'folk-medicine')
  remove(@Param('id') id: string) {
    return this.folkMedicineService.remove(this.decode(id));
  }

  @Post(':id/view')
  @RequirePermission('READ', 'folk-medicine')
  incrementViewCount(@Param('id') id: string) {
    return this.folkMedicineService.incrementViewCount(this.decode(id));
  }

  @Post(':id/like')
  @RequirePermission('READ', 'folk-medicine')
  incrementLikeCount(@Param('id') id: string) {
    return this.folkMedicineService.incrementLikeCount(this.decode(id));
  }
} 