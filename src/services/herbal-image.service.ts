import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HerbalImage, HerbalImageType } from '../entities/herbal-image.entity';
import { plainToClass } from 'class-transformer';
import { HerbalImageDto } from 'src/dtos/herbal-image.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Injectable()
export class HerbalImageService {
  constructor(
    @InjectRepository(HerbalImage)
    private readonly herbalImageRepository: Repository<HerbalImage>,
  ) {}

  async create(data: HerbalImageDto): Promise<HerbalImage> {
    const herbal = Object.assign(data, {
      herbalId: Number(Base64EncryptionUtil.decrypt(data.herbalId))
    })
    const herbalImage = this.herbalImageRepository.create(herbal);
    return this.herbalImageRepository.save(herbalImage);
  }

  async findAll(): Promise<HerbalImage[]> {
    const herbalImages = await this.herbalImageRepository.find({
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(HerbalImage, herbalImages);
  }

  async findByHerbalId(herbalId: number): Promise<HerbalImage[]> {
    const herbalImages = await this.herbalImageRepository.find({
      where: { herbalId, isActive: true },
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(HerbalImage, herbalImages);
  }

  async findByType(herbalId: number, type: HerbalImageType): Promise<HerbalImage[]> {
    const herbalImages = await this.herbalImageRepository.find({
      where: { herbalId, type, isActive: true },
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(HerbalImage, herbalImages);
  }

  async findOne(id: number): Promise<HerbalImage> {
    const herbalImage = await this.herbalImageRepository.findOne({
      where: { id },
    });
    if (!herbalImage) throw new NotFoundException('Herbal image not found');
    return plainToClass(HerbalImage, herbalImage);
  }

  async update(id: number, data: HerbalImageDto): Promise<HerbalImage> {
    const herbalImage = await this.findOne(id);
    Object.assign(herbalImage, data);
    return this.herbalImageRepository.save(herbalImage);
  }

  async remove(id: number): Promise<void> {
    const result = await this.herbalImageRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Herbal image not found');
  }

  async removeByHerbalId(herbalId: number): Promise<void> {
    await this.herbalImageRepository.delete({ herbalId });
  }

  async updateSortOrder(images: { id: number; sortOrder: number }[]): Promise<void> {
    for (const image of images) {
      await this.herbalImageRepository.update(image.id, { sortOrder: image.sortOrder });
    }
  }

  async getMainImage(herbalId: number): Promise<HerbalImage | null> {
    const mainImage = await this.herbalImageRepository.findOne({
      where: { herbalId, type: HerbalImageType.MAIN, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    return mainImage ? plainToClass(HerbalImage, mainImage) : null;
  }
} 