import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { FolkMedicineService } from '../../services/folk-medicine.service';
import { FolkMedicineDto } from '../../dtos/folk-medicine.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';
import { AddDiseasesToFolkMedicineDto, RemoveDiseasesFromFolkMedicineDto } from '../../dtos/disease.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
@Controller('folk-medicine')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FolkMedicineController extends BaseController {
  constructor(private readonly folkMedicineService: FolkMedicineService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'folk-medicine')
  async create(@Body() dto: FolkMedicineDto, @Res() res: Response) {
    try{
      const data = await this.folkMedicineService.create(dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
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
  async findAll(@Res() res: Response) {
    try {
      const data = await this.folkMedicineService.findAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'folk-medicine')
  async findByCategory(@Param('categoryId') categoryId: string, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.findByCategory(this.decode(categoryId));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'folk-medicine')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.findOne(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'folk-medicine')
  async update(@Param('id') id: string, @Body() dto: FolkMedicineDto, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.update(this.decode(id), dto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'folk-medicine')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.remove(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/view')
  @RequirePermission('READ', 'folk-medicine')
  async incrementViewCount(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.incrementViewCount(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/like')
  @RequirePermission('READ', 'folk-medicine')
  async incrementLikeCount(@Param('id') id: string, @Res() res: Response) {
    try {
      const data = await this.folkMedicineService.incrementLikeCount(this.decode(id));
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/diseases')
  @RequirePermission('UPDATE', 'folk-medicine')
  @HttpCode(HttpStatus.OK)
  async addDiseases(
    @Param('id') id: string,
    @Body() dto: AddDiseasesToFolkMedicineDto,
    @Res() res: Response,
  ) {
    try {
      const folkMedicineId = this.decode(id);
      const diseaseIds = dto.diseaseIds.map(diseaseId => Base64EncryptionUtil.decrypt(diseaseId));
      const data = await this.folkMedicineService.addDiseases(folkMedicineId, diseaseIds);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id/diseases')
  @RequirePermission('UPDATE', 'folk-medicine')
  @HttpCode(HttpStatus.OK)
  async removeDiseases(
    @Param('id') id: string,
    @Body() dto: RemoveDiseasesFromFolkMedicineDto,
    @Res() res: Response,
  ) {
    try {
      const folkMedicineId = this.decode(id);
      const diseaseIds = dto.diseaseIds.map(diseaseId => Base64EncryptionUtil.decrypt(diseaseId));
      const data = await this.folkMedicineService.removeDiseases(folkMedicineId, diseaseIds);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/diseases')
  @RequirePermission('UPDATE', 'folk-medicine')
  async setDiseases(
    @Param('id') id: string,
    @Body() dto: AddDiseasesToFolkMedicineDto,
    @Res() res: Response,
  ) {
    try {
      const folkMedicineId = this.decode(id);
      const diseaseIds = dto.diseaseIds.map(diseaseId => Base64EncryptionUtil.decrypt(diseaseId));
      const data = await this.folkMedicineService.setDiseases(folkMedicineId, diseaseIds);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id/diseases')
  @RequirePermission('READ', 'folk-medicine')
  async getDiseases(@Param('id') id: string, @Res() res: Response) {
    try {
      const folkMedicine = await this.folkMedicineService.findOne(this.decode(id));
      return this.success(res, folkMedicine.diseases || []);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 