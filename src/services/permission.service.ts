import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Permission } from '../entities/permission.entity';
import { CreatePermissionDto, UpdatePermissionDto } from '../dtos/permission.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    return await this.permissionRepository.find({
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });
    
    if (!permission) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
    
    return permission;
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    Object.assign(permission, updatePermissionDto);
    return await this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const result = await this.permissionRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Permission with ID ${id} not found`);
    }
  }
  
  async findByType(type: 'MENU' | 'FUNCTION'): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { code: type }, // Sử dụng type assertion để tránh lỗi kiểu
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Permission>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.permissionRepository.createQueryBuilder('permission');

    if (search) {
      queryBuilder.where('permission.name LIKE :search OR permission.code LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('permission.createdAt', 'DESC')
      .getManyAndCount();

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }
} 