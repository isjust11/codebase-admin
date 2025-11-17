import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { DiseaseService } from '../../services/disease.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { DiseaseDto } from '../../dtos/disease.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { Response } from 'express';

@Controller('diseases')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DiseaseController extends BaseController {
  constructor(private readonly diseaseService: DiseaseService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'disease')
  async findByPage(
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
      const data = await this.diseaseService.findPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('all')
  @RequirePermission('READ', 'disease')
  async findAll(@Res() res: Response) {
    try {
      const data = await this.diseaseService.getAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'disease')
  async create(@Body() createDiseaseDto: DiseaseDto, @Res() res: Response) {
    try {
      const data = await this.diseaseService.create(createDiseaseDto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'disease')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const disease = await this.diseaseService.findOne(this.decode(id));
      return this.success(res, disease);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'disease')
  async update(
    @Param('id') id: string,
    @Body() updateDiseaseDto: DiseaseDto,
    @Res() res: Response,
  ) {
    try {
      const disease = await this.diseaseService.update(this.decode(id), updateDiseaseDto);
      return this.success(res, disease);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'disease')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteById(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.diseaseService.deleteById(this.decode(id));
      return this.success(res, { message: 'Disease deleted successfully' });
    } catch (error) {
      return this.error(res, error);
    }
  }
}

