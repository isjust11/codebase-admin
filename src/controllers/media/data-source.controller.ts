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
  HttpStatus,
  ParseIntPipe,
  Req,
  Res,
} from '@nestjs/common';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { DataSourceDto } from 'src/dtos/data-source.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { DataSourceService } from 'src/services/data-source.service';
import { BaseController } from '../base/base.controller';
import { Response } from 'express';

@Controller('data-sources')
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
  async findAll(@Query() queryDto: PaginationParams, @Res() res: Response) {
    const result = await this.dataSourceService.findPagination(queryDto);
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
  async findOne(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const dataSource = await this.dataSourceService.findOne(id);
    return this.success(res, dataSource);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'SOURCE')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDataSourceDto: DataSourceDto,
    @Res() res: Response
  ) {
    try {
      const dataSource = await this.dataSourceService.update(id, updateDataSourceDto);
      return this.success(res, dataSource);
    } catch (error) {
      this.error(res, error);
    }

  }

  @Delete(':id')
  @RequirePermission('DELETE', 'SOURCE')
  async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    try {
      const dataSource = await this.dataSourceService.remove(id);
      return this.success(res, dataSource);
    } catch (error) {
      this.error(res, error);
    }
  }
}
