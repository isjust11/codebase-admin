import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FoodItemService } from '../services/food-item.service';
import { FoodItem } from '../entities/food-item.entity';
import { CreateFoodItemDto, UpdateFoodItemDto } from '../dtos/food-item.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('food-items')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FoodItemController extends BaseController{
  constructor(private readonly foodItemService: FoodItemService) {
    super();
  }

  @Post()
  @RequirePermission('CREATE', 'food-item')
  create(@Body() createFoodItemDto: CreateFoodItemDto) {
    return this.foodItemService.create(createFoodItemDto);
  }

  @Get()
  @RequirePermission('READ', 'food-item')
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.foodItemService.findAllWithPagination(filter);
  }

  @Get(':id')
  @RequirePermission('READ', 'food-item')
  findOne(@Param('id') id: string) {
    return this.foodItemService.findOne(+id);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'food-item')
  update(@Param('id') id: string, @Body() updateFoodItemDto: UpdateFoodItemDto) {
    return this.foodItemService.update(+id, updateFoodItemDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'food-item')
  remove(@Param('id') id: string) {
    return this.foodItemService.remove(+id);
  }

  @Patch(':id/status')
  @RequirePermission('UPDATE', 'food-item')
  updateStatus(
    @Param('id') id: string,
    @Body('statusCategoryId') statusCategoryId: string,
  ) {
    return this.foodItemService.updateStatus(+id, statusCategoryId);
  }

  @Patch(':id/availability')
  @RequirePermission('UPDATE', 'food-item')
  updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.foodItemService.updateAvailability(+id, isAvailable);
  }

  @Patch(':id/discount')
  @RequirePermission('UPDATE', 'food-item')
    updateDiscount(
    @Param('id') id: string,
    @Body() discountData: {
      discountPercent: number;
      discountStartTime: Date;
      discountEndTime: Date;
    },
  ) {
    return this.foodItemService.updateDiscount(+id, discountData);
  }
} 