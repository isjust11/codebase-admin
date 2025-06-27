import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { CreatePermissionDto, UpdatePermissionDto } from '../dtos/permission.dto';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('permissions')
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @Post()
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.permissionService.findAllWithPagination(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.permissionService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.permissionService.remove(+id);
  }
} 