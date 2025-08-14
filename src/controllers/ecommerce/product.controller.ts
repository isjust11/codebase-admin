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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ProductService } from '../../services/product.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CreateProductDto, UpdateProductDto, ProductResponseDto } from '../../dtos/product.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductController extends BaseController {
  constructor(private readonly productService: ProductService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'product')
  async findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.productService.findPagination(filter);
  }

  @Post()
  @RequirePermission('CREATE', 'product')
  async create(@Body() createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.productService.create(createProductDto);
    return plainToClass(ProductResponseDto, product);
  }

  @Get(':id')
  @RequirePermission('READ', 'product')
  async findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    const product = await this.productService.findOne(this.decode(id));
    return plainToClass(ProductResponseDto, product);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'product')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const product = await this.productService.update(this.decode(id), updateProductDto);
    return plainToClass(ProductResponseDto, product);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'product')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.productService.remove(this.decode(id));
  }
}