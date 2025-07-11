import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, UseGuards } from '@nestjs/common';
import { FeatureContentService } from '../services/feature-content.service';
import { FeatureContentDto } from '../dtos/feature-content.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('feature-content')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FeatureContentController extends BaseController{
  constructor(private readonly featureContentService: FeatureContentService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'feature-content')
  create(@Body() dto: FeatureContentDto) {
    return this.featureContentService.create(dto);
  }

  @Get()
  @RequirePermission('READ', 'feature-content')
  findAll() {
    return this.featureContentService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'feature-content')
  findOne(@Param('id') id: string) {
    return this.featureContentService.findOne(Number(id));
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'feature-content')
  update(@Param('id') id: string, @Body() dto: FeatureContentDto) {
    return this.featureContentService.update(Number(id), dto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'feature-content')
  remove(@Param('id') id: string) {
    return this.featureContentService.remove(Number(id));
  }
} 