import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  UseGuards,
  Res,
  Put,
} from '@nestjs/common';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { DataSourceDto } from 'src/dtos/data-source.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { DataSourceService } from 'src/services/data-source.service';
import { BaseController } from '../base/base.controller';
import { Response } from 'express';

@Controller('data-source')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class DataSourceController extends BaseController {
  constructor(private readonly dataSourceService: DataSourceService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'SOURCE')
  async create(@Body() createDataSourceDto: DataSourceDto, @Res() res: Response) {
    try {
      const data = await this.dataSourceService.create(createDataSourceDto);
      return this.success(res, data);
    } catch (error) {
      this.error(res, error);
    }

  }

  @Get()
  @RequirePermission('READ', 'SOURCE')
  async findPagination(@Query() queryDto: PaginationParams, @Res() res: Response) {
    try {
      const result = await this.dataSourceService.findPagination(queryDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
    
  }

  @Get('all')
  @RequirePermission('READ', 'SOURCE')
  async findAll(@Res() res: Response) {
    const result = await this.dataSourceService.findAll();
    return this.success(res, result);
  }

  @Get('types')
  @RequirePermission('READ', 'SOURCE')
  async getDataSourceTypes(@Res() res: Response) {
    const types = await this.dataSourceService.getTypes();
    return this.success(res, types);
  }


  @Get(':id')
  @RequirePermission('READ', 'SOURCE')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    const dataSource = await this.dataSourceService.findOne(this.decode(id));
    return this.success(res, dataSource);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'SOURCE')
  async update(
    @Param('id') id: string,
    @Body() updateDataSourceDto: DataSourceDto,
    @Res() res: Response
  ) {
    try {
      const dataSource = await this.dataSourceService.update(this.decode(id), updateDataSourceDto);
      return this.success(res, dataSource);
    } catch (error) {
      this.error(res, error);
    }

  }

  @Put(':id/status')
  @RequirePermission('UPDATE', 'SOURCE')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
    @Res() res: Response,
  ) {
    try {
      const dataSource = await this.dataSourceService.updateStatus(this.decode(id), body.isActive);
      return this.success(res, dataSource);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'SOURCE')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const dataSource = await this.dataSourceService.remove(this.decode(id));
      return this.success(res, dataSource);
    } catch (error) {
      this.error(res, error);
    }
  }
}
