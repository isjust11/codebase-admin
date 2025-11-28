import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository, DeepPartial } from 'typeorm';
import { Disease } from '../entities/disease.entity';
import slugify from 'slugify';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { DiseaseDto } from 'src/dtos/disease.dto';
import { ImageEntityType, MultiImage } from 'src/entities/multi-image.entity';
import { Category } from 'src/entities/category.entity';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { Author } from 'src/entities/author.entity';
import { DataSource } from 'src/entities/data-source.entity';

@Injectable()
export class DiseaseService {
  constructor(
    @InjectRepository(Disease)
    private readonly diseaseRepository: Repository<Disease>,
    @InjectRepository(MultiImage)
    private readonly multiImageRepository: Repository<MultiImage>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(DataSource)
    private readonly dataSourceRepository: Repository<DataSource>,
  ) { }

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
    if (data.categoryId) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId);
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      data.categoryId = categoryId;
    } else {
      data.categoryId = null;
    }
    if (data.authorId) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      const author = await this.authorRepository.findOne({ where: { id: authorId } });
      if (!author) throw new NotFoundException('Author not found');
      data.authorId = authorId;
    } else {
      data.authorId = null;
    }
    if (data.dataSourceId) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId);
      const dataSource = await this.dataSourceRepository.findOne({ where: { id: dataSourceId } });
      if (!dataSource) throw new NotFoundException('Data source not found');
      data.dataSourceId = dataSourceId;
    } else {
      data.dataSourceId = null;
    }
    const disease = this.diseaseRepository.create(data as DeepPartial<Disease>);
    const saved = await this.diseaseRepository.save(disease);
    if (data.imagePaths && data.imagePaths.length > 0) {
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
    if (data.categoryId) {
      const categoryId = Base64EncryptionUtil.decrypt(data.categoryId);
      const category = await this.categoryRepository.findOne({ where: { id: categoryId } });
      if (!category) throw new NotFoundException('Category not found');
      disease.categoryId = categoryId;
    } else {
      disease.categoryId = null;
    }
    if (data.authorId) {
      const authorId = Base64EncryptionUtil.decrypt(data.authorId);
      const author = await this.authorRepository.findOne({ where: { id: authorId } });
      if (!author) throw new NotFoundException('Author not found');
      disease.authorId = authorId;
    } else {
      disease.authorId = null;
    }
    if (data.dataSourceId) {
      const dataSourceId = Base64EncryptionUtil.decrypt(data.dataSourceId);
      const dataSource = await this.dataSourceRepository.findOne({ where: { id: dataSourceId } });
      if (!dataSource) throw new NotFoundException('Data source not found');
      disease.dataSourceId = dataSourceId;
    } else {
      disease.dataSourceId = null;
    }

    if (data.imagePaths && (data.imagePaths || []).length > 0) {
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

