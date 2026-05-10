import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { AdvertisingSliderService } from '../../services/advertising-slider.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { AdvertisingSlider, SliderType, SliderPosition } from '../../entities/advertising-slider.entity';
import { CreateAdvertisingSliderDto, UpdateAdvertisingSliderDto, AdvertisingSliderFilterDto } from '../../dtos/advertising-slider.dto';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('advertising-sliders')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class AdvertisingSliderController extends BaseController {
  constructor(private advertisingSliderService: AdvertisingSliderService) { super(); }

  @Get()
  @RequirePermission('READ', 'advertising-slider')
  async getSliders(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('type') type: SliderType,
    @Query('position') position: SliderPosition,
    @Query('isActive') isActive: boolean,
    @Query('isFeatured') isFeatured: boolean,
    @Query('createdById') createdById: string,
  ) {
    const filter: PaginationParams & AdvertisingSliderFilterDto = {
      page,
      size,
      search,
      type,
      position,
      isActive,
      isFeatured,
      createdById,
    };

    return this.advertisingSliderService.findAllWithPagination(filter);
  }

  @Get('all')
  @RequirePermission('READ', 'advertising-slider')
  async getAllSliders(): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.findAll();
  }

  @Get('active')
  async getActiveSliders(): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getActiveSliders();
  }

  @Get('featured')
  async getFeaturedSliders(): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getFeaturedSliders();
  }

  @Get('position/:position')
  async getSlidersByPosition(@Param('position') position: SliderPosition): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getSlidersByPosition(position);
  }

  @Get('type/:type')
  async getSlidersByType(@Param('type') type: SliderType): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getSlidersByType(type);
  }

  @Get('stats')
  @RequirePermission('READ', 'advertising-slider')
  async getSliderStats() {
    return this.advertisingSliderService.getSliderStats();
  }

  @Get(':id')
  @RequirePermission('READ', 'advertising-slider')
  async getSliderById(@Param('id') id: string, @Locale() locale: SupportedLocale): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.findById(this.decode(id), locale);
  }

  @Post()
  @RequirePermission('CREATE', 'advertising-slider')
  async create(
    @Body() createAdvertisingSliderDto: CreateAdvertisingSliderDto,
    @Req() req: any
  ): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.create(createAdvertisingSliderDto);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'advertising-slider')
  async update(
    @Param('id') id: string,
    @Body() updateAdvertisingSliderDto: UpdateAdvertisingSliderDto,
    @Req() req: any,
    @Locale() locale: SupportedLocale
  ): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.update(this.decode(id), updateAdvertisingSliderDto, locale);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'advertising-slider')
  async remove(@Param('id') id: string, @Locale() locale: SupportedLocale): Promise<void> {
    return this.advertisingSliderService.remove(this.decode(id), locale);
  }

  // Mobile app specific endpoints (no authentication required for these)
  @Get('mobile/active')
  async getMobileActiveSliders(): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getActiveSliders();
  }

  @Get('mobile/featured')
  async getMobileFeaturedSliders(): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getFeaturedSliders();
  }

  @Get('mobile/position/:position')
  async getMobileSlidersByPosition(@Param('position') position: SliderPosition): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getSlidersByPosition(position);
  }

  @Get('mobile/type/:type')
  async getMobileSlidersByType(@Param('type') type: SliderType): Promise<AdvertisingSlider[]> {
    return this.advertisingSliderService.getSlidersByType(type);
  }

  // Analytics tracking endpoints
  @Post(':id/view')
  async incrementView(@Param('id') id: string, @Locale() locale: SupportedLocale): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.incrementViewCount(this.decode(id), locale);
  }

  @Post(':id/click')
  async incrementClick(@Param('id') id: string, @Locale() locale: SupportedLocale): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.incrementClickCount(this.decode(id), locale);
  }

  // Management endpoints
  @Put(':id/toggle-active')
  @RequirePermission('UPDATE', 'advertising-slider')
  async toggleActive(
    @Param('id') id: string,
    @Req() req: any,
    @Locale() locale: SupportedLocale
  ): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.toggleActive(this.decode(id), locale);
  }

  @Put(':id/toggle-featured')
  @RequirePermission('UPDATE', 'advertising-slider')
  async toggleFeatured(
    @Param('id') id: string,
    @Req() req: any,
    @Locale() locale: SupportedLocale
  ): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.toggleFeatured(this.decode(id), locale);
  }

  @Put(':id/order/:order')
  @RequirePermission('UPDATE', 'advertising-slider')
  async updateOrder(
    @Param('id') id: string,
    @Param('order') order: string,
    @Req() req: any,
    @Locale() locale: SupportedLocale
  ): Promise<AdvertisingSlider> {
    return this.advertisingSliderService.updateOrder(this.decode(id), +order, locale);
  }
} 