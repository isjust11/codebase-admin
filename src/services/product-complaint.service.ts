import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { ProductComplaint, ComplaintStatus, ComplaintPriority } from '../entities/product-complaint.entity';
import { Product } from '../entities/product.entity';
import { CreateProductComplaintDto, UpdateProductComplaintDto, AssignComplaintDto, ResolveComplaintDto, ProductComplaintFilterDto } from '../dtos/product-complaint.dto';
import { PaginationParams } from '../dtos/filter.dto';

@Injectable()
export class ProductComplaintService {
  constructor(
    @InjectRepository(ProductComplaint)
    private productComplaintRepository: Repository<ProductComplaint>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async create(createProductComplaintDto: CreateProductComplaintDto, userId: string): Promise<ProductComplaint> {
    // Kiểm tra sản phẩm tồn tại
    const product = await this.productRepository.findOne({
      where: { id: parseInt(createProductComplaintDto.productId) }
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const complaint = this.productComplaintRepository.create({
      ...createProductComplaintDto,
      productId: parseInt(createProductComplaintDto.productId),
      userId,
    });

    return this.productComplaintRepository.save(complaint);
  }

  async findAll(): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      relations: ['user', 'product', 'assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllWithPagination(filter: PaginationParams & ProductComplaintFilterDto): Promise<{
    data: ProductComplaint[];
    total: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    const { page = 1, size = 10, productId, userId, assignedToId, type, status, priority, isUrgent, sortBy, sortOrder } = filter;

    const whereConditions: FindOptionsWhere<ProductComplaint> = {};

    if (productId) {
      whereConditions.productId = parseInt(productId);
    }

    if (userId) {
      whereConditions.userId = userId;
    }

    if (assignedToId) {
      whereConditions.assignedToId = assignedToId;
    }

    if (type) {
      whereConditions.type = type;
    }

    if (status) {
      whereConditions.status = status;
    }

    if (priority) {
      whereConditions.priority = priority;
    }

    if (isUrgent !== undefined) {
      whereConditions.isUrgent = isUrgent;
    }

    const orderBy = sortBy || 'createdAt';
    const orderDirection = sortOrder || 'DESC';

    const [data, total] = await this.productComplaintRepository.findAndCount({
      where: whereConditions,
      relations: ['user', 'product', 'assignedTo', 'resolvedBy'],
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

  async findById(id: number): Promise<ProductComplaint> {
    const complaint = await this.productComplaintRepository.findOne({
      where: { id },
      relations: ['user', 'product', 'assignedTo', 'resolvedBy'],
    });

    if (!complaint) {
      throw new NotFoundException(`Complaint with ID ${id} not found`);
    }

    return complaint;
  }

  async findByProductId(productId: number): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { productId },
      relations: ['user', 'assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { userId },
      relations: ['product', 'assignedTo', 'resolvedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async update(id: number, updateProductComplaintDto: UpdateProductComplaintDto, userId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    // Chỉ cho phép user tạo complaint hoặc admin được cập nhật
    if (complaint.userId !== userId && !this.isAdmin(userId)) {
      throw new BadRequestException('You can only update your own complaint or you need admin permission');
    }

    Object.assign(complaint, updateProductComplaintDto);
    return this.productComplaintRepository.save(complaint);
  }

  async remove(id: number, userId: string): Promise<void> {
    const complaint = await this.findById(id);

    // Chỉ cho phép user tạo complaint hoặc admin được xóa
    if (complaint.userId !== userId && !this.isAdmin(userId)) {
      throw new BadRequestException('You can only delete your own complaint or you need admin permission');
    }

    await this.productComplaintRepository.remove(complaint);
  }

  async assign(id: number, assignDto: AssignComplaintDto, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.assignedToId = assignDto.assignedToId;
    complaint.status = ComplaintStatus.IN_PROGRESS;

    return this.productComplaintRepository.save(complaint);
  }

  async resolve(id: number, resolveDto: ResolveComplaintDto, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.resolution = resolveDto.resolution;
    complaint.status = ComplaintStatus.RESOLVED;
    complaint.resolvedById = adminId;
    complaint.resolvedAt = new Date();

    return this.productComplaintRepository.save(complaint);
  }

  async close(id: number, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.status = ComplaintStatus.CLOSED;
    complaint.closedAt = new Date();

    return this.productComplaintRepository.save(complaint);
  }

  async reject(id: number, reason: string, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.status = ComplaintStatus.REJECTED;
    complaint.adminNotes = reason;

    return this.productComplaintRepository.save(complaint);
  }

  async updateStatus(id: number, status: ComplaintStatus, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.status = status;

    if (status === ComplaintStatus.RESOLVED) {
      complaint.resolvedById = adminId;
      complaint.resolvedAt = new Date();
    } else if (status === ComplaintStatus.CLOSED) {
      complaint.closedAt = new Date();
    }

    return this.productComplaintRepository.save(complaint);
  }

  async updatePriority(id: number, priority: ComplaintPriority, adminId: string): Promise<ProductComplaint> {
    const complaint = await this.findById(id);

    complaint.priority = priority;

    return this.productComplaintRepository.save(complaint);
  }

  async getUrgentComplaints(): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { isUrgent: true, status: ComplaintStatus.PENDING },
      relations: ['user', 'product', 'assignedTo'],
      order: { createdAt: 'ASC' },
    });
  }

  async getComplaintsByStatus(status: ComplaintStatus): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { status },
      relations: ['user', 'product', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getComplaintsByType(type: string): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { type },
      relations: ['user', 'product', 'assignedTo'],
      order: { createdAt: 'DESC' },
    });
  }

  async getComplaintsByAssignedTo(assignedToId: string): Promise<ProductComplaint[]> {
    return this.productComplaintRepository.find({
      where: { assignedToId },
      relations: ['user', 'product'],
      order: { createdAt: 'DESC' },
    });
  }

  async getComplaintStats(): Promise<{
    total: number;
    pending: number;
    inProgress: number;
    resolved: number;
    rejected: number;
    closed: number;
    urgent: number;
  }> {
    const [total, pending, inProgress, resolved, rejected, closed, urgent] = await Promise.all([
      this.productComplaintRepository.count(),
      this.productComplaintRepository.count({ where: { status: ComplaintStatus.PENDING } }),
      this.productComplaintRepository.count({ where: { status: ComplaintStatus.IN_PROGRESS } }),
      this.productComplaintRepository.count({ where: { status: ComplaintStatus.RESOLVED } }),
      this.productComplaintRepository.count({ where: { status: ComplaintStatus.REJECTED } }),
      this.productComplaintRepository.count({ where: { status: ComplaintStatus.CLOSED } }),
      this.productComplaintRepository.count({ where: { isUrgent: true } }),
    ]);

    return {
      total,
      pending,
      inProgress,
      resolved,
      rejected,
      closed,
      urgent,
    };
  }

  private isAdmin(userId: string): boolean {
    // Implement logic to check if user is admin
    // This is a placeholder - you should implement proper admin check
    return true; // For now, assume all users can perform admin actions
  }
} 