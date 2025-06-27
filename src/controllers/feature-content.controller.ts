import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors } from '@nestjs/common';
import { FeatureContentService } from '../services/feature-content.service';
import { FeatureContentDto } from '../dtos/feature-content.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';

@Controller('feature-content')
@UseInterceptors(EncryptionInterceptor)
export class FeatureContentController {
  constructor(private readonly featureContentService: FeatureContentService) {}

  @Post()
  create(@Body() dto: FeatureContentDto) {
    return this.featureContentService.create(dto);
  }

  @Get()
  findAll() {
    return this.featureContentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureContentService.findOne(Number(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: FeatureContentDto) {
    return this.featureContentService.update(Number(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.featureContentService.remove(Number(id));
  }
} 