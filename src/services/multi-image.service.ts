import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MultiImage, HerbalImageType, ImageEntityType } from '../entities/multi-image.entity';
import { plainToClass } from 'class-transformer';
import { MultiImageDto } from 'src/dtos/multi-image.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { MediaService } from './media.service';

@Injectable()
export class MultiImageService {
  constructor(
    @InjectRepository(MultiImage)
    private readonly multiImageRepository: Repository<MultiImage>,
    private readonly mediaService: MediaService,
  ) {}

  async create(data: MultiImageDto): Promise<MultiImage> {
    // Hỗ trợ tương thích ngược: nếu có herbalId thì map sang entityType và entityId
    let entityType = data.entityType;
    let entityId: number;

    if (data.herbalId && !data.entityId) {
      // Tương thích ngược: dùng herbalId
      entityType = ImageEntityType.HERBAL;
      entityId = Base64EncryptionUtil.decrypt(data.herbalId as string);
    } else {
      entityId = Base64EncryptionUtil.decrypt(data.entityId as string);
    }

    const imageData = <MultiImage>{
      ...data,
      entityType,
      entityId,
    };
    delete (imageData as any).herbalId; // Xóa herbalId nếu có
    const multiImage = this.multiImageRepository.create(imageData);
    return this.multiImageRepository.save(multiImage);
  }

  async findAll(): Promise<MultiImage[]> {
    const multiImages = await this.multiImageRepository.find({
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(MultiImage, multiImages);
  }

  async findByEntity(entityType: ImageEntityType, entityId: number): Promise<MultiImage[]> {
    const images = await this.multiImageRepository.find({
      where: { entityType, entityId, isActive: true },
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(MultiImage, images);
  }

  async findByEntityAndType(entityType: ImageEntityType, entityId: number, type: HerbalImageType): Promise<MultiImage[]> {
    const images = await this.multiImageRepository.find({
      where: { entityType, entityId, type, isActive: true },
      order: { sortOrder: 'ASC', id: 'DESC' },
    });
    return plainToClass(MultiImage, images);
  }

  async getMainImageByEntity(entityType: ImageEntityType, entityId: number): Promise<MultiImage | null> {
    const mainImage = await this.multiImageRepository.findOne({
      where: { entityType, entityId, type: HerbalImageType.MAIN, isActive: true },
      order: { sortOrder: 'ASC' },
    });
    return mainImage ? plainToClass(MultiImage, mainImage) : null;
  }

  // Deprecated: Giữ lại để tương thích ngược
  async findByHerbalId(herbalId: number): Promise<MultiImage[]> {
    return this.findByEntity(ImageEntityType.HERBAL, herbalId);
  }

  // Deprecated: Giữ lại để tương thích ngược
  async findByType(herbalId: number, type: HerbalImageType): Promise<MultiImage[]> {
    return this.findByEntityAndType(ImageEntityType.HERBAL, herbalId, type);
  }

  // Deprecated: Giữ lại để tương thích ngược
  async getMainImage(herbalId: number): Promise<MultiImage | null> {
    return this.getMainImageByEntity(ImageEntityType.HERBAL, herbalId);
  }

  async findOne(id: number): Promise<MultiImage> {
    const multiImage = await this.multiImageRepository.findOne({
      where: { id },
    });
    if (!multiImage) throw new NotFoundException('Multi image not found');
    return plainToClass(MultiImage, multiImage);
  }

  async update(id: number, data: MultiImageDto): Promise<MultiImage> {
    const multiImage = await this.findOne(id);
    
    // Xử lý entityType và entityId nếu có trong data
    if (data.entityId) {
      (multiImage as any).entityId = data.entityId;
    }
    if (data.entityType) {
      (multiImage as any).entityType = data.entityType;
    }
    
    // Hỗ trợ tương thích ngược
    if (data.herbalId && !data.entityId) {
      (multiImage as any).entityType = ImageEntityType.HERBAL;
      (multiImage as any).entityId = Base64EncryptionUtil.decrypt(data.herbalId);
    }

    Object.assign(multiImage, {
      ...data,
      entityId: (multiImage as any).entityId,
      entityType: (multiImage as any).entityType,
    });
    delete (multiImage as any).herbalId;
    
    return this.multiImageRepository.save(multiImage);
  }

  async remove(id: number): Promise<boolean> {
    const multiImage = await this.findOne(id);
    const filename = multiImage.url?.split('/').pop() ?? '';
    if (filename) {
      await this.mediaService.deleteFile(filename, 1);
    }
    const result = await this.multiImageRepository.delete({
      id,
      isActive: true,
    });
    if (result.affected === 0) throw new NotFoundException('Multi image not found');
    return true;
  }

  async removeByEntity(entityType: ImageEntityType, entityId: number): Promise<void> {
    await this.multiImageRepository.delete({ entityType, entityId });
  }

  // Deprecated: Giữ lại để tương thích ngược
  async removeByHerbalId(herbalId: number): Promise<void> {
    await this.removeByEntity(ImageEntityType.HERBAL, herbalId);
  }

  async updateSortOrder(images: { id: number; sortOrder: number }[]): Promise<void> {
    for (const image of images) {
      await this.multiImageRepository.update(image.id, { sortOrder: image.sortOrder });
    }
  }
} 