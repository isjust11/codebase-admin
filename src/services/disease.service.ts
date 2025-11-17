import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, In } from 'typeorm';
import { Disease } from '../entities/disease.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { DiseaseDto } from 'src/dtos/disease.dto';
import { ImageEntityType, MultiImage } from 'src/entities/multi-image.entity';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(Disease)
    private readonly diseaseRepository: Repository<Disease>,
    @InjectRepository(MultiImage)
    private readonly multiImageRepository: Repository<MultiImage>,
  ) {}

  async findPagination(params: PaginationParams): Promise<PaginatedResponse<Disease>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { name: Like(`%${search}%`) },
      { slug: Like(`%${search}%`) },
      { description: Like(`%${search}%`) },
      { symptoms: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.diseaseRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['folkMedicines'],
      order: { id: 'DESC' },
    });

    return {
      data: plainToClass(Disease, data),
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async getAll(): Promise<Disease[]> {
    const data = await this.diseaseRepository.find({
      relations: ['folkMedicines'],
      order: { id: 'DESC' },
    });
  
    return plainToClass(Disease, data);
  }

  async create(data: DiseaseDto): Promise<Disease> {
    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    if (data.slug) {
      data.slug = slugify(data.slug, { lower: true, strict: true });
    }
    const disease = this.diseaseRepository.create({
      ...data,
      authorId: data.authorId ? Base64EncryptionUtil.decrypt(data.authorId) : undefined,
      categoryId: data.categoryId ? Base64EncryptionUtil.decrypt(data.categoryId) : undefined,
      dataSourceId: data.dataSourceId ? Base64EncryptionUtil.decrypt(data.dataSourceId) : undefined,
    });
    const saved = await this.diseaseRepository.save(disease);
    if(data.imagePaths && data.imagePaths.length > 0) {
      data.imagePaths.map(async (path) => {
        const multiImage = this.multiImageRepository.create({
          entityType: ImageEntityType.DISEASE,
          entityId: saved.id,
          url: path,
        });
        await this.multiImageRepository.save(multiImage); 
      });
    }
    return saved;
  }

  async findAll(): Promise<Disease[]> {
    const diseases = await this.diseaseRepository.find({
      relations: ['folkMedicines'],
      order: { id: 'DESC' },
    });
    return plainToClass(Disease, diseases);
  }

  async findOne(id: number): Promise<DiseaseDto> {
    const disease = await this.diseaseRepository.findOne({
      where: { id },
      relations: ['folkMedicines'],
    });
    const images = await this.multiImageRepository.find({
      where: { entityType: ImageEntityType.DISEASE, entityId: id },
    });
    if (!disease) throw new NotFoundException('Disease not found');
    return {
      ...plainToClass(DiseaseDto, disease),
      imagePaths: images.map(image => image.url),
    };
  }

  async update(id: number, data: DiseaseDto): Promise<Disease> {
    const disease = await this.findOne(id);
    Object.assign(disease, {
      ...data,
      id: id,
    });

    if (data.name && !data.slug) {
      disease.slug = slugify(data.name, { lower: true, strict: true });
    } else if (data.slug) {
      disease.slug = slugify(data.slug, { lower: true, strict: true });
    }

    if(data.imagePaths && (data.imagePaths || []).length > 0) {
      const existingImages = await this.multiImageRepository.find({
        where: { entityType: ImageEntityType.DISEASE, entityId: id },
      });
      existingImages.forEach(async (image) => {
        await this.multiImageRepository.remove(image);
      });
      (data.imagePaths || []).map(async (path) => {
        const multiImage = this.multiImageRepository.create({
          entityType: ImageEntityType.DISEASE,
          entityId: id,
          url: path,
        });
        await this.multiImageRepository.save(multiImage);
      });
    }
    return this.diseaseRepository.save(plainToClass(Disease, disease));
  }

  async deleteById(id: number): Promise<void> {
    const existingImages = await this.multiImageRepository.find({
      where: { entityType: ImageEntityType.DISEASE, entityId: id },
    });
    existingImages.forEach(async (image) => {
      await this.multiImageRepository.remove(image);
    });
    await this.diseaseRepository.delete(id);
  }
}

