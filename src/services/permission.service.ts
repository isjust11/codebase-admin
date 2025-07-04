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
      relations: ['feature'],
      order: { name: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['feature'],
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
      where: { code: type },
      relations: ['feature'],
      order: { name: 'ASC' },
    });
  }

  // Thêm phương thức mới để tìm permission theo action và resource
  async findByActionAndResource(action: string, resource?: string): Promise<Permission[]> {
    const queryBuilder = this.permissionRepository.createQueryBuilder('permission')
      .leftJoinAndSelect('permission.feature', 'feature')
      .where('permission.action = :action', { action });

    if (resource) {
      queryBuilder.andWhere('permission.resource = :resource', { resource });
    }

    return await queryBuilder.getMany();
  }

  // Tìm permission theo action
  async findByAction(action: string): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { action },
      relations: ['feature'],
      order: { name: 'ASC' },
    });
  }

  // Tìm permission theo resource
  async findByResource(resource: string): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { resource },
      relations: ['feature'],
      order: { name: 'ASC' },
    });
  }

  // Tìm permission theo feature
  async findByFeature(featureId: number): Promise<Permission[]> {
    return await this.permissionRepository.find({
      where: { featureId },
      relations: ['feature'],
      order: { name: 'ASC' },
    });
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Permission>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.permissionRepository.createQueryBuilder('permission')
      .leftJoinAndSelect('permission.feature', 'feature');

    if (search) {
      queryBuilder.where('permission.name LIKE :search OR permission.code LIKE :search OR permission.action LIKE :search OR permission.resource LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('permission.code', 'ASC')
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