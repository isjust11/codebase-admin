import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Media } from '../entities/media.entity';
import { UploadMediaDto, UpdateMediaDto } from '../dtos/media.dto';
import * as fs from 'fs';
import * as path from 'path';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { User } from 'src/entities/user.entity';
import imageSize from 'image-size';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
  ) { }

  async findAll(userId: number): Promise<Media[]> {
    return this.mediaRepository.find({
      where: { isDeleted: false, userId },
    });
  }

  async findById(id: number, userId: number): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id, userId },
    });
    if (!media) {
      throw new NotFoundException(`Media with ID ${id} not found`);
    }
    return media;
  }

  async create(createMediaDto: UploadMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return this.mediaRepository.save(media);
  }

  async update(id: number, updateMediaDto: UpdateMediaDto, userId: number): Promise<Media> {
    const media = await this.findById(id, userId);
    Object.assign(media, updateMediaDto);
    return this.mediaRepository.save(media);
  }

  async remove(id: number, userId: number): Promise<void> {
    const media = await this.findById(id, userId);
    media.isDeleted = true;
    await this.mediaRepository.save(media);
  }

  async updateMediaFile(id: number, file: Express.Multer.File, user: User): Promise<Media> {
    const media = await this.findById(id, user.id);
    const oldFilePath = media.path;

    // Delete old file
    if (fs.existsSync(oldFilePath)) {
      fs.unlinkSync(oldFilePath);
    }

    // Save new file
    const uploadPath = path.join('uploads', user.id.toString());
    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const newFilePath = path.join(uploadPath, uniqueFilename);
    fs.writeFileSync(newFilePath, file.buffer);

    let width: number | null = null;
    let height: number | null = null;
    if (file.mimetype.startsWith('image/')) {
      try {
        const dimensions = imageSize(file.buffer);
        width = dimensions.width;
        height = dimensions.height;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    // Update media entity
    media.filename = uniqueFilename;
    media.originalName = file.originalname;
    media.mimeType = file.mimetype;
    media.size = file.size;
    media.width = width;
    media.height = height;
    media.path = newFilePath;
    media.url = `/${newFilePath.replace(/\\/g, '/')}`;

    return this.mediaRepository.save(media);
  }

  async deleteFile(id: number, userId: number): Promise<void> {
    const media = await this.findById(id, userId);
    const filePath = path.join(process.cwd(), media.path);

    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      await this.remove(id, userId);
    } catch (_error) {
      throw new Error(`Failed to delete file: ${_error.message}`);
    }
  }

  async upload(file: Express.Multer.File, user: User): Promise<Media> {
    const uploadPath = path.join('uploads', user.id.toString());
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    const uniqueFilename = `${Date.now()}-${file.originalname}`;
    const filePath = path.join(uploadPath, uniqueFilename);
    fs.writeFileSync(filePath, file.buffer);

    let width: number = 200;
    let height: number = 200;

    if (file.mimetype.startsWith('image/')) {
      try {
        const dimensions = imageSize(file.buffer);
        width = dimensions.width;
        height = dimensions.height;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    const newMedia = new Media();
    newMedia.filename = uniqueFilename;
    newMedia.originalName = file.originalname;
    newMedia.mimeType = file.mimetype;
    newMedia.size = file.size;
    newMedia.width = width;
    newMedia.height = height;
    newMedia.path = filePath;
    newMedia.url = `/${filePath.replace(/\\/g, '/')}`;
    newMedia.user = user;
    newMedia.userId = user.id;

    return this.mediaRepository.save(newMedia);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Media>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    if (search) {
      queryBuilder.where('media.name LIKE :search OR media.type LIKE :search', {
        search: `%${search}%`,
      });
    }

    const [data, total] = await queryBuilder
      .skip(skip)
      .take(size)
      .orderBy('media.createdAt', 'DESC')
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