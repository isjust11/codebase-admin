import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { ProductReview } from '../entities/product-review.entity';
import { Product } from '../entities/product.entity';
import { CreateProductReviewDto, UpdateProductReviewDto, ReplyProductReviewDto, ProductReviewFilterDto } from '../dtos/product-review.dto';
import { PaginationParams } from '../dtos/filter.dto';

@Injectable()
export class ProductReviewService {
  constructor(
    @InjectRepository(ProductReview)
    private productReviewRepository: Repository<ProductReview>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductReviewDto: CreateProductReviewDto, userId: string): Promise<ProductReview> {
    // Kiểm tra sản phẩm tồn tại
    const product = await this.productRepository.findOne({
      where: { id: parseInt(createProductReviewDto.productId) }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Kiểm tra user đã đánh giá sản phẩm này chưa
    const existingReview = await this.productReviewRepository.findOne({
      where: { userId, productId: parseInt(createProductReviewDto.productId) }
    });

    if (existingReview) {
      throw new BadRequestException('You have already reviewed this product');
    }

    const review = this.productReviewRepository.create({
      ...createProductReviewDto,
      productId: parseInt(createProductReviewDto.productId),
      userId,
    });

    const savedReview = await this.productReviewRepository.save(review);

    // Cập nhật rating trung bình của sản phẩm
    await this.updateProductRating(parseInt(createProductReviewDto.productId));

    return savedReview;
  }

  async findAll(): Promise<ProductReview[]> {
    return this.productReviewRepository.find({
      relations: ['user', 'product', 'repliedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithPagination(filter: PaginationParams & ProductReviewFilterDto): Promise<{
    data: ProductReview[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const { page = 1, size = 10, productId, userId, rating, isVerified, isHelpful, sortBy, sortOrder } = filter;

    const whereConditions: FindOptionsWhere<ProductReview> = {};

    if (productId) {
      whereConditions.productId = parseInt(productId);
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    if (rating) {
      whereConditions.rating = rating;
    }

    if (isVerified !== undefined) {
      whereConditions.isVerified = isVerified;
    }

    if (isHelpful !== undefined) {
      whereConditions.isHelpful = isHelpful;
    }

    const orderBy = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';

    const [data, total] = await this.productReviewRepository.findAndCount({
      where: whereConditions,
      relations: ['user', 'product', 'repliedBy'],
      order: { [orderBy]: orderDirection },
      skip: (page - 1) * size,
      take: size,
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findById(id: number): Promise<ProductReview> {
    const review = await this.productReviewRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'repliedBy'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async findByProductId(productId: number): Promise<ProductReview[]> {
    return this.productReviewRepository.find({
      where: { productId },
      relations: ['user', 'repliedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateProductReviewDto: UpdateProductReviewDto, userId: string): Promise<ProductReview> {
    const review = await this.findById(id);

    // Chỉ cho phép user tạo review mới được cập nhật
    if (review.userId !== userId) {
      throw new BadRequestException('You can only update your own review');
    }

    Object.assign(review, updateProductReviewDto);
    const updatedReview = await this.productReviewRepository.save(review);

    // Cập nhật rating trung bình của sản phẩm
    await this.updateProductRating(review.productId);

    return updatedReview;
  }

  async remove(id: number, userId: string): Promise<void> {
    const review = await this.findById(id);

    // Chỉ cho phép user tạo review mới được xóa
    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own review');
    }

    const productId = review.productId;
    await this.productReviewRepository.remove(review);

    // Cập nhật rating trung bình của sản phẩm
    await this.updateProductRating(productId);
  }

  async reply(id: number, replyDto: ReplyProductReviewDto, adminId: string): Promise<ProductReview> {
    const review = await this.findById(id);

    review.reply = replyDto.reply;
    review.repliedById = adminId;
    review.repliedAt = new Date();

    return this.productReviewRepository.save(review);
  }

  async toggleVerified(id: number): Promise<ProductReview> {
    const review = await this.findById(id);
    review.isVerified = !review.isVerified;
    return this.productReviewRepository.save(review);
  }

  async toggleHelpful(id: number): Promise<ProductReview> {
    const review = await this.findById(id);
    review.isHelpful = !review.isHelpful;
    review.helpfulCount = review.isHelpful ? review.helpfulCount + 1 : review.helpfulCount - 1;
    return this.productReviewRepository.save(review);
  }

  async getProductReviews(productId: number, limit: number = 10): Promise<ProductReview[]> {
    return this.productReviewRepository.find({
      where: { productId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUserReviews(userId: string, limit: number = 10): Promise<ProductReview[]> {
    return this.productReviewRepository.find({
      where: { userId },
      relations: ['product'],
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  private async updateProductRating(productId: number): Promise<void> {
    const reviews = await this.productReviewRepository.find({
      where: { productId },
      select: ['rating'],
    });

    if (reviews.length > 0) {
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      await this.productRepository.update(productId, {
        rating: Math.round(averageRating * 10) / 10, // Làm tròn đến 1 chữ số thập phân
        reviewCount: reviews.length,
      });
    } else {
      await this.productRepository.update(productId, {
        rating: 0,
        reviewCount: 0,
      });
    }
  }
} 