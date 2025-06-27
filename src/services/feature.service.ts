import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Role } from '../entities/role.entity';
import { AssignRoleDto } from 'src/dtos/assign-role.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { Feature } from 'src/entities/feature.entity';
import { FeatureDto } from 'src/dtos/feature.dto';

@Injectable()
export class FeatureService {
    constructor(
        @InjectRepository(Feature)
        private featureRepository: Repository<Feature>,
        @InjectRepository(Role)
        private roleRepository: Repository<Role>,
    ) { }

    async create(createFeatureDto: FeatureDto): Promise<Feature> {
        const decodedId = parseInt(Base64EncryptionUtil.decrypt(createFeatureDto?.parentId ?? ''));
        const feature = this.featureRepository.create({
            icon: createFeatureDto.icon ?? '',
            label: createFeatureDto.label,
            link: createFeatureDto.link,
            parentId: Number.isNaN(decodedId) ? undefined : decodedId,
            isActive: createFeatureDto.isActive,
            sortOrder: createFeatureDto.sortOrder,
            featureTypeId:createFeatureDto.featureTypeId,
            iconType: createFeatureDto.iconType,
            iconSize: createFeatureDto.iconSize??20,
            className: createFeatureDto.className
        });
        return await this.featureRepository.save(feature);
    }

    async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Feature>> {
        const { page = 1, size = 10, search = '' } = params;
        const skip = (page - 1) * size;

        const queryBuilder = this.featureRepository.createQueryBuilder('feature')
            .leftJoinAndSelect('feature.children', 'children')
            .leftJoinAndSelect('feature.parent', 'parent')
            .leftJoinAndSelect('feature.featureType', 'featureType');

        if (search) {
            queryBuilder.where('feature.label LIKE :search OR feature.link LIKE :search', {
                search: `%${search}%`,
            });
        }

        const [data, total] = await queryBuilder
            .skip(skip)
            .take(size)
            .orderBy('feature.createdAt', 'DESC')
            .getManyAndCount();

        return {
            data,
            total,
            page,
            size,
            totalPages: Math.ceil(total / size),
        };
    }

    async findAll(): Promise<Feature[]> {
        return await this.featureRepository.find({
            relations: ['children'],
            order: { label: 'ASC' },
        });
    }

    async findOne(id: number): Promise<Feature> {
        const feature = await this.featureRepository.findOne({
            where: { id },
            relations: ['children', 'parent'],
        });

        if (!feature) {
            throw new NotFoundException(`Feature with ID ${id} not found`);
        }

        return feature;
    }

    async update(id: number, updateFeatureDto: FeatureDto): Promise<Feature> {
        const feature = await this.findOne(id);
        Object.assign(feature, updateFeatureDto);
        if (!updateFeatureDto.parentId || updateFeatureDto.parentId === '') {
            feature.parent = undefined;
            feature.parentId = undefined;
        } else {
            const parentId = parseInt(Base64EncryptionUtil.decrypt(updateFeatureDto.parentId ?? ''));
            feature.parent = await this.featureRepository.findOne({ where: { id: parentId } }) ?? undefined;
        }
        return await this.featureRepository.save(feature);
    }

    async remove(id: number): Promise<void> {
        const result = await this.featureRepository.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`Feature with ID ${id} not found`);
        }
    }

    async assignRoles(featureId: number, assignRoleDto: AssignRoleDto) {
        const feature = await this.featureRepository.findOne({
            where: { id: featureId },
            relations: ['roles'],
        });

        if (!feature) {
            throw new Error('Feature not found');
        }

        const roles = await this.roleRepository.findByIds(assignRoleDto.roleIds);
        // feature.roles = roles;

        return this.featureRepository.save(feature);
    }

    async removeRoles(featureId: number, roleIds: number[]) {
        const feature = await this.featureRepository.findOne({
            where: { id: featureId },
            relations: ['roles'],
        });

        if (!feature) {
            throw new Error('Feature not found');
        }
        // feature.roles = feature.roles.filter(
        //     role => !roleIds.includes(role.id)
        // );

        return this.featureRepository.save(feature);
    }

    // async getFeatureRoles(featureId: number) {
    //     const feature = await this.featureRepository.findOne({
    //         where: { id: featureId },
    //         relations: ['roles'],
    //     });

    //     if (!feature) {
    //         throw new Error('Feature not found');
    //     }

    //     return feature.roles;
    // }
}