import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, Like } from 'typeorm';
import { Role } from '../entities/role.entity';
import { RoleDto } from '../dtos/role.dto';
import { Permission } from '../entities/permission.entity';
import { Feature } from '../entities/feature.entity';
import { AssignFeatureDto } from '../dtos/assign-navigator.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
    @InjectRepository(Feature)
    private featureRepository: Repository<Feature>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions','features'],
    });
  }

  async findById(id: number): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions','features','features.featureType'],
    });
  }

   async findByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { code },
      relations: ['permissions','features'],
    });
  }

  async create(createRoleDto: RoleDto): Promise<Role> {
    const role = this.roleRepository.create({
      name: createRoleDto.name,
      code: createRoleDto.code,
      description: createRoleDto.description,
    });

    if (createRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(createRoleDto.permissionIds) },
      });
      role.permissions = permissions;
    }
    if (createRoleDto.features) {
      const lstFeatureDecodes = createRoleDto.features.map((nav)=>Base64EncryptionUtil.decrypt(nav)) ;
      const navigators = await this.featureRepository.find({
        where: { id: In(lstFeatureDecodes) },
      });
      role.features = navigators;
    }

    return this.roleRepository.save(role);
  }

  async update(id: number, updateRoleDto: RoleDto): Promise<Role> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (updateRoleDto.name) {
      role.name = updateRoleDto.name;
    }

    if (updateRoleDto.code) {
      role.code = updateRoleDto.code;
    }

    if (updateRoleDto.isActive !== undefined) {
      role.isActive = updateRoleDto.isActive;
    }

    if (updateRoleDto.description !== undefined) {
      role.description = updateRoleDto.description;
    }

    if (updateRoleDto.permissionIds) {
      const permissions = await this.permissionRepository.find({
        where: { id: In(updateRoleDto.permissionIds) },
      });
      role.permissions = permissions;
    }

    if (updateRoleDto.features) {
      // Giải mã các id feature từ base64
      const featureDecodes = updateRoleDto.features.map((item) => Base64EncryptionUtil.decrypt(item));
      // Hàm đệ quy lấy tất cả id con của 1 feature
      const getAllChildIds = async (ids, visited = new Set()) => {
        let allIds = [...ids];
        for (const id of ids) {
          if (visited.has(id)) continue;
          visited.add(id);
          const feature = await this.featureRepository.findOne({ where: { id: Number(id) }, relations: ['children'] });
          if (feature && feature.children && feature.children.length > 0) {
            const childIds = feature.children.map(child => child.id.toString());
            const deeper = await getAllChildIds(childIds, visited);
            allIds = allIds.concat(deeper);
          }
        }
        return allIds;
      };
      // Lấy tất cả id (bao gồm cha và con, loại trùng)
      const allFeatureIds = Array.from(new Set(await getAllChildIds(featureDecodes)));
      const features = await this.featureRepository.find({
        where: { id: In(allFeatureIds) },
      });
      role.features = features;
    }
    return this.roleRepository.save(role);
  }

  async remove(id: number): Promise<void> {
    const result = await this.roleRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }
  }

  async getFeaturesByRole(roleId: number) {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['features','features.featureType'],
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    return role.features;
  }

  async assignFeatures(roleId: number, assignFeatureDto: AssignFeatureDto): Promise<Role> {
    const role = await this.findById(roleId);
    if (!role) {
      throw new NotFoundException(`Role with ID ${roleId} not found`);
    }

    const features = await this.featureRepository.find({
      where: { id: In(assignFeatureDto.navigatorIds) },
    });

    role.features = features;
    return this.roleRepository.save(role);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Role>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.roleRepository.createQueryBuilder('role')
      .leftJoinAndSelect('role.permissions', 'permissions');

    if (search) {
      queryBuilder.where('role.name LIKE :search OR role.code LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('role.createdAt', 'DESC')
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