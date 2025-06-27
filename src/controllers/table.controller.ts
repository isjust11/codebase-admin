import { Controller, Get, Post, Body, Put, Param, Delete, UseInterceptors, Query } from '@nestjs/common';
import { AppService } from '../app.service';
import { TableService } from '../services/table.service';
import { Table } from '../entities/table.entity';
import { PaginationParams } from 'src/dtos/filter.dto';
import { EncryptionInterceptor } from '../interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Controller('table')
@UseInterceptors(EncryptionInterceptor)
export class TableController {
  constructor(
    private readonly appService: AppService,
    private readonly tableService: TableService,
  ) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.tableService.findAllWithPagination(filter);
  }

  @Get('all')
  async getAllTables() {
    return this.tableService.findAll();
  }

  @Post()
  async createTable(@Body() table: Table): Promise<Table> {
    return this.tableService.create(table);
  }

  @Put(':id')
  async updateTable(@Param('id') id: string, @Body() table: Table): Promise<Table | null> {
    const decodedId = Base64EncryptionUtil.decrypt(id);
    return this.tableService.update(parseInt(decodedId), table);
  }

  @Delete(':id')
  async deleteTable(@Param('id') id: string): Promise<void> {
    const decodedId = Base64EncryptionUtil.decrypt(id);
    return this.tableService.remove(parseInt(decodedId));
  }

  @Get(':id')
  getTable(@Param('id') id: string) {
    const decodedId = Base64EncryptionUtil.decrypt(id);
    return this.tableService.findOne(parseInt(decodedId));
  }
}
