import { Controller, Get, Post, Put, Delete, Body, Param, Request, UseGuards, Query, Req } from '@nestjs/common';
import { ProductService } from '../services/product.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Product } from '../entities/product.entity';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from '../dtos/product.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';

@Controller('products')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ProductController extends BaseController {
  constructor(private productService: ProductService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'product')
  async getProducts(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Query('categoryId') categoryId: string,
    @Query('isActive') isActive: boolean,
    @Query('isFeatured') isFeatured: boolean,
    @Query('minPrice') minPrice: number,
    @Query('maxPrice') maxPrice: number,
    @Query('brand') brand: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const filter: PaginationParams & ProductFilterDto = {
      page: page || 1,
      size: size || 10,
      search: search || '',
      categoryId,
      isActive,
      isFeatured,
      minPrice,
      maxPrice,
      brand,
      sortBy: sortBy as 'name' | 'price' | 'createdAt' | 'viewCount' | 'soldCount' | 'rating',
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };
    return this.productService.findAllWithPagination(filter);
  }

  @Get('all')
  @RequirePermission('READ', 'product')
  async findAll(): Promise<Product[]> {
    return this.productService.findAll();
  }

  @Get('featured')
  @RequirePermission('READ', 'product')
  async getFeaturedProducts(@Query('limit') limit: number = 10): Promise<Product[]> {
    return this.productService.getFeaturedProducts(limit);
  }

  @Get('search')
  @RequirePermission('READ', 'product')
  async searchProducts(
    @Query('q') query: string,
    @Query('limit') limit: number = 20,
  ): Promise<Product[]> {
    return this.productService.searchProducts(query, limit);
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'product')
  async getProductsByCategory(
    @Param('categoryId') categoryId: string,
    @Query('limit') limit: number = 20,
  ): Promise<Product[]> {
    return this.productService.getProductsByCategory(categoryId, limit);
  }

  @Get(':id')
  @RequirePermission('READ', 'product')
  async findOne(@Param('id') id: string): Promise<Product | null> {
    return this.productService.findById(this.decode(id));
  }

  @Get('slug/:slug')
  @RequirePermission('READ', 'product')
  async findBySlug(@Param('slug') slug: string): Promise<Product | null> {
    return this.productService.findBySlug(slug);
  }

  @Post()
  @RequirePermission('CREATE', 'product')
  async create(@Body() createProductDto: CreateProductDto, @Req() req: any): Promise<Product> {
    const userId = req?.user?.id;
    return this.productService.create(createProductDto, userId);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'product')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @Req() req: any,
  ): Promise<Product> {
    const userId = req?.user?.id;
    return this.productService.update(this.decode(id), updateProductDto, userId);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'product')
  async remove(@Param('id') id: string): Promise<void> {
    return this.productService.remove(this.decode(id));
  }

  @Put(':id/toggle-active')
  @RequirePermission('UPDATE', 'product')
  async toggleActive(@Param('id') id: string, @Req() req: any): Promise<Product> {
    const userId = req?.user?.id;
    return this.productService.toggleActive(this.decode(id), userId);
  }

  @Put(':id/toggle-featured')
  @RequirePermission('UPDATE', 'product')
  async toggleFeatured(@Param('id') id: string, @Req() req: any): Promise<Product> {
    const userId = req?.user?.id;
    return this.productService.toggleFeatured(this.decode(id), userId);
  }

  @Put(':id/increment-view')
  @RequirePermission('UPDATE', 'product')
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    return this.productService.incrementViewCount(this.decode(id));
  }

  @Put(':id/update-stock')
  @RequirePermission('UPDATE', 'product')
  async updateStock(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ): Promise<Product> {
    return this.productService.updateStock(this.decode(id), body.quantity);
  }
} 