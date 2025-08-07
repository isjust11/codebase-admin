import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ProductComplaintService } from '../services/product-complaint.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { ProductComplaint, ComplaintStatus, ComplaintPriority, ComplaintType } from '../entities/product-complaint.entity';
import { CreateProductComplaintDto, UpdateProductComplaintDto, AssignComplaintDto, ResolveComplaintDto, ProductComplaintFilterDto } from '../dtos/product-complaint.dto';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from './base.controller';

@Controller('product-complaints')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class ProductComplaintController extends BaseController {
  constructor(private productComplaintService: ProductComplaintService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'product-complaint')
  async getComplaints(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('productId') productId: string,
    @Query('userId') userId: string,
    @Query('assignedToId') assignedToId: string,
    @Query('type') type: string,
    @Query('status') status: string,
    @Query('priority') priority: string,
    @Query('isUrgent') isUrgent: boolean,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: string,
  ) {
    const filter: PaginationParams & ProductComplaintFilterDto = {
      page: page || 1,
      size: size || 10,
      productId,
      userId,
      assignedToId,
      type: type as ComplaintType,
      status: status as ComplaintStatus,
      priority: priority as ComplaintPriority,
      isUrgent,
      sortOrder: sortOrder as 'ASC' | 'DESC',
    };
    return this.productComplaintService.findAllWithPagination(filter);
  }

  @Get('all')
  @RequirePermission('READ', 'product-complaint')
  async findAll(): Promise<ProductComplaint[]> {
    return this.productComplaintService.findAll();
  }

  @Get('urgent')
  @RequirePermission('READ', 'product-complaint')
  async getUrgentComplaints(): Promise<ProductComplaint[]> {
    return this.productComplaintService.getUrgentComplaints();
  }

  @Get('stats')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintStats() {
    return this.productComplaintService.getComplaintStats();
  }

  @Get('status/:status')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintsByStatus(@Param('status') status: ComplaintStatus): Promise<ProductComplaint[]> {
    return this.productComplaintService.getComplaintsByStatus(status);
  }

  @Get('type/:type')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintsByType(@Param('type') type: string): Promise<ProductComplaint[]> {
    return this.productComplaintService.getComplaintsByType(type);
  }

  @Get('assigned/:assignedToId')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintsByAssignedTo(@Param('assignedToId') assignedToId: string): Promise<ProductComplaint[]> {
    return this.productComplaintService.getComplaintsByAssignedTo(assignedToId);
  }

  @Get('product/:productId')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintsByProduct(@Param('productId') productId: string): Promise<ProductComplaint[]> {
    return this.productComplaintService.findByProductId(this.decode(productId));
  }

  @Get('user/:userId')
  @RequirePermission('READ', 'product-complaint')
  async getComplaintsByUser(@Param('userId') userId: string): Promise<ProductComplaint[]> {
    return this.productComplaintService.findByUserId(userId);
  }

  @Get(':id')
  @RequirePermission('READ', 'product-complaint')
  async findOne(@Param('id') id: string): Promise<ProductComplaint | null> {
    return this.productComplaintService.findById(this.decode(id));
  }

  @Post()
  @RequirePermission('CREATE', 'product-complaint')
  async create(@Body() createProductComplaintDto: CreateProductComplaintDto, @Req() req: any): Promise<ProductComplaint> {
    const userId = req?.user?.id;
    return this.productComplaintService.create(createProductComplaintDto, userId);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'product-complaint')
  async update(
    @Param('id') id: string,
    @Body() updateProductComplaintDto: UpdateProductComplaintDto,
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const userId = req?.user?.id;
    return this.productComplaintService.update(this.decode(id), updateProductComplaintDto, userId);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'product-complaint')
  async remove(@Param('id') id: string, @Req() req: any): Promise<void> {
    const userId = req?.user?.id;
    return this.productComplaintService.remove(this.decode(id), userId);
  }

  @Post(':id/assign')
  @RequirePermission('UPDATE', 'product-complaint')
  async assign(
    @Param('id') id: string,
    @Body() assignDto: AssignComplaintDto,
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.assign(this.decode(id), assignDto, adminId);
  }

  @Post(':id/resolve')
  @RequirePermission('UPDATE', 'product-complaint')
  async resolve(
    @Param('id') id: string,
    @Body() resolveDto: ResolveComplaintDto,
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.resolve(this.decode(id), resolveDto, adminId);
  }

  @Put(':id/close')
  @RequirePermission('UPDATE', 'product-complaint')
  async close(@Param('id') id: string, @Req() req: any): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.close(this.decode(id), adminId);
  }

  @Put(':id/reject')
  @RequirePermission('UPDATE', 'product-complaint')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason: string },
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.reject(this.decode(id), body.reason, adminId);
  }

  @Put(':id/status/:status')
  @RequirePermission('UPDATE', 'product-complaint')
  async updateStatus(
    @Param('id') id: string,
    @Param('status') status: ComplaintStatus,
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.updateStatus(this.decode(id), status, adminId);
  }

  @Put(':id/priority/:priority')
  @RequirePermission('UPDATE', 'product-complaint')
  async updatePriority(
    @Param('id') id: string,
    @Param('priority') priority: ComplaintPriority,
    @Req() req: any,
  ): Promise<ProductComplaint> {
    const adminId = req?.user?.id;
    return this.productComplaintService.updatePriority(this.decode(id), priority, adminId);
  }
} 