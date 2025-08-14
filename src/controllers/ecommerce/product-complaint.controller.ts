import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductComplaintService } from '../../services/product-complaint.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CreateProductComplaintDto, UpdateProductComplaintDto, ProductComplaintResponseDto } from '../../dtos/product-complaint.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('product-complaints')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class ProductComplaintController extends BaseController {
  constructor(private readonly productComplaintService: ProductComplaintService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'productComplaint')
  async findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.productComplaintService.findPagination(filter);
  }

  @Post()
  @RequirePermission('CREATE', 'productComplaint')
  async create(@Body() createProductComplaintDto: CreateProductComplaintDto): Promise<ProductComplaintResponseDto> {
    const productComplaint = await this.productComplaintService.create(createProductComplaintDto);
    return plainToClass(ProductComplaintResponseDto, productComplaint);
  }

  @Get(':id')
  @RequirePermission('READ', 'productComplaint')
  async findOne(@Param('id') id: string): Promise<ProductComplaintResponseDto> {
    const productComplaint = await this.productComplaintService.findOne(this.decode(id));
    return plainToClass(ProductComplaintResponseDto, productComplaint);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'productComplaint')
  async update(
    @Param('id') id: string,
    @Body() updateProductComplaintDto: UpdateProductComplaintDto,
  ): Promise<ProductComplaintResponseDto> {
    const productComplaint = await this.productComplaintService.update(this.decode(id), updateProductComplaintDto);
    return plainToClass(ProductComplaintResponseDto, productComplaint);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'productComplaint')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.productComplaintService.remove(this.decode(id));
  }
} 