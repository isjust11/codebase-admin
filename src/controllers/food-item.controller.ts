import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { FoodItemService } from '../services/food-item.service';
import { FoodItem } from '../entities/food-item.entity';
import { CreateFoodItemDto, UpdateFoodItemDto } from '../dtos/food-item.dto';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('food-items')
export class FoodItemController {
  constructor(private readonly foodItemService: FoodItemService) {}

  @Post()
  create(@Body() createFoodItemDto: CreateFoodItemDto) {
    return this.foodItemService.create(createFoodItemDto);
  }

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.foodItemService.findAllWithPagination(filter);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodItemService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFoodItemDto: UpdateFoodItemDto) {
    return this.foodItemService.update(+id, updateFoodItemDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foodItemService.remove(+id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('statusCategoryId') statusCategoryId: string,
  ) {
    return this.foodItemService.updateStatus(+id, statusCategoryId);
  }

  @Patch(':id/availability')
  updateAvailability(
    @Param('id') id: string,
    @Body('isAvailable') isAvailable: boolean,
  ) {
    return this.foodItemService.updateAvailability(+id, isAvailable);
  }

  @Patch(':id/discount')
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