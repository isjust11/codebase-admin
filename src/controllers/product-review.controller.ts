import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ProductReviewService } from '../services/product-review.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProductReview } from '../entities/product-review.entity';
import { CreateProductReviewDto, UpdateProductReviewDto, ReplyProductReviewDto, ProductReviewFilterDto } from '../dtos/product-review.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';

@Controller('product-reviews')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ProductReviewController extends BaseController {
  constructor(private productReviewService: ProductReviewService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'product-review')
  async getReviews(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('productId') productId: string,
    @Query('userId') userId: string,
    @Query('rating') rating: number,
    @Query('isVerified') isVerified: boolean,
    @Query('isHelpful') isHelpful: boolean,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const filter: PaginationParams & ProductReviewFilterDto = {
      page: page || 1,
      size: size || 10,
      productId,
      userId,
      rating,
      isVerified,
      isHelpful,
      sortBy: sortBy as 'rating' | 'createdAt' | 'helpfulCount' | undefined,
      sortOrder: sortOrder as 'ASC' | 'DESC' | undefined,
    };
    return this.productReviewService.findAllWithPagination(filter);
  }

  @Get('all')
  @RequirePermission('READ', 'product-review')
  async findAll(): Promise<ProductReview[]> {
    return this.productReviewService.findAll();
  }

  @Get('product/:productId')
  @RequirePermission('READ', 'product-review')
  async getReviewsByProduct(
    @Param('productId') productId: string,
    @Query('limit') limit: number = 10,
  ): Promise<ProductReview[]> {
    return this.productReviewService.getProductReviews(this.decode(productId), limit);
  }

  @Get('user/:userId')
  @RequirePermission('READ', 'product-review')
  async getReviewsByUser(
    @Param('userId') userId: string,
    @Query('limit') limit: number = 10,
  ): Promise<ProductReview[]> {
    return this.productReviewService.getUserReviews(userId, limit);
  }

  @Get(':id')
  @RequirePermission('READ', 'product-review')
  async findOne(@Param('id') id: string): Promise<ProductReview | null> {
    return this.productReviewService.findById(this.decode(id));
  }

  @Post()
  @RequirePermission('CREATE', 'product-review')
  async create(@Body() createProductReviewDto: CreateProductReviewDto, @Req() req: any): Promise<ProductReview> {
    const userId = req.user.id;
    return this.productReviewService.create(createProductReviewDto, userId);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'product-review')
  async update(
    @Param('id') id: string,
    @Body() updateProductReviewDto: UpdateProductReviewDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    const userId = req.user.id;
    return this.productReviewService.update(this.decode(id), updateProductReviewDto, userId);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'product-review')
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const userId = req.user.id;
    return this.productReviewService.remove(this.decode(id), userId);
  }

  @Post(':id/reply')
  @RequirePermission('UPDATE', 'product-review')
  async reply(
    @Param('id') id: string,
    @Body() replyDto: ReplyProductReviewDto,
    @Req() req: any,
  ): Promise<ProductReview> {
    const adminId = req.user.id;
    return this.productReviewService.reply(this.decode(id), replyDto, adminId);
  }

  @Put(':id/toggle-verified')
  @RequirePermission('UPDATE', 'product-review')
  async toggleVerified(@Param('id') id: string): Promise<ProductReview> {
    return this.productReviewService.toggleVerified(this.decode(id));
  }

  @Put(':id/toggle-helpful')
  @RequirePermission('UPDATE', 'product-review')
  async toggleHelpful(@Param('id') id: string): Promise<ProductReview> {
    return this.productReviewService.toggleHelpful(this.decode(id));
  }
} 