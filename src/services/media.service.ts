import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, In } from 'typeorm';
import { Media } from '../entities/media.entity';
import { UploadMediaDto, UpdateMediaDto } from '../dtos/media.dto';
import * as fs from 'fs';
import * as path from 'path';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { User } from 'src/entities/user.entity';
import imageSize from 'image-size';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import FormData from 'form-data';

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) { }

  private get storageServiceUrl(): string {
    const url = this.configService.get<string>('STORAGE_SERVICE_URL') || 'http://localhost:3005';
    return url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private get storageClientKey(): string {
    const key = this.configService.get<string>('STORAGE_CLIENT_KEY') || '';
    return key;
  }

  private get storageClientHeaderName(): string {
    // Matches default of storage service; can be overridden if needed
    return this.configService.get<string>('STORAGE_CLIENT_HEADER') || 'x-client-key';
  }

  private buildAbsoluteUrl(relativeOrAbsolute: string): string {
    try {
      // If already absolute, URL constructor with base will keep it
      return new URL(relativeOrAbsolute, this.storageServiceUrl).toString();
    } catch (_err) {
      return relativeOrAbsolute;
    }
  }

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
    // media.isDeleted = true;
    await this.mediaRepository.remove(media);
  }

  async updateMediaFile(id: number, file: Express.Multer.File, user: User): Promise<Media> {
    const media = await this.findById(id, user.id);
    const oldFilename = media.filename;

    // Attempt to delete old remote file (ignore if not found)
    if (oldFilename) {
      try {
        await axios.delete(`${this.storageServiceUrl}/storage/${encodeURIComponent(oldFilename)}`, {
          headers: { [this.storageClientHeaderName]: this.storageClientKey },
        });
      } catch (_err) {
        // Ignore storage delete errors to not block update
      }
    }

    // Upload new file to storage service
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype, knownLength: file.size });
    const uploadRes = await axios.post(`${this.storageServiceUrl}/storage/upload`, form, {
      headers: { ...form.getHeaders(), [this.storageClientHeaderName]: this.storageClientKey },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const stored = uploadRes.data as { filename: string; size: number; mimeType: string; url: string };

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

    // Update media entity with storage service data
    media.filename = stored.filename;
    media.originalName = file.originalname;
    media.mimeType = file.mimetype;
    media.size = stored.size ?? file.size;
    media.width = width;
    media.height = height;
    media.path = stored.url; // keep original relative for traceability
    media.url = this.buildAbsoluteUrl(stored.url);

    return this.mediaRepository.save(media);
  }

  async deleteFile(id: number, userId: number): Promise<void> {
    const media = await this.findById(id, userId);
    try {
      if (media.filename) {
        try {
          await axios.delete(`${this.storageServiceUrl}/storage/${encodeURIComponent(media.filename)}`, {
            headers: { [this.storageClientHeaderName]: this.storageClientKey },
          });
        } catch (_err) {
          // Ignore remote not found
        }
      }
      await this.remove(id, userId);
    } catch (_error) {
      throw new Error(`Failed to delete file: ${_error.message}`);
    }
  }

  async deleteMultiple(ids: number[], userId: number): Promise<void> {
    const medias = await this.mediaRepository.find({ where: { id: In(ids) } });
    for (const media of medias) {
      await this.deleteFile(media.id, userId);
    }
  }
  

  async upload(file: Express.Multer.File, user: User): Promise<Media> {
    // Upload buffer to centralized storage service
    const form = new FormData();
    form.append('file', file.buffer, { filename: file.originalname, contentType: file.mimetype, knownLength: file.size });
    const uploadRes = await axios.post(`${this.storageServiceUrl}/storage/upload`, form, {
      headers: { ...form.getHeaders(), [this.storageClientHeaderName]: this.storageClientKey },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const stored = uploadRes.data as { filename: string; size: number; mimeType: string; url: string };

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
    newMedia.filename = stored.filename;
    newMedia.originalName = file.originalname;
    newMedia.mimeType = file.mimetype;
    newMedia.size = stored.size ?? file.size;
    newMedia.width = width;
    newMedia.height = height;
    newMedia.path = stored.url; // keep relative
    newMedia.url = this.buildAbsoluteUrl(stored.url);
    newMedia.user = user;
    newMedia.userId = user.id;

    return this.mediaRepository.save(newMedia);
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Media>> {
    const { page = 1, size = 100, search = '', mimeType ='' } = params;
    const skip = (page - 1) * size;
 
    const queryBuilder = this.mediaRepository.createQueryBuilder('media');

    if (search || mimeType) {
      if (search && mimeType && mimeType !== '*') {
        // Có cả search và mimeType (không phải tất cả)
        queryBuilder.where('media.originalName LIKE :search AND media.mimeType LIKE :mediaType', {
          search: `%${search}%`,
          mediaType: `%${mimeType}%`
        });
      } else if (search && (!mimeType || mimeType === '*')) {
        // Chỉ có search, không có mimeType hoặc mimeType là tất cả
        queryBuilder.where('media.originalName LIKE :search', {
          search: `%${search}%`
        });
      } else if (mimeType && mimeType !== '*' && !search) {
        // Chỉ có mimeType (không phải tất cả), không có search
        queryBuilder.where('media.mimeType LIKE :mediaType', {
          mediaType: `%${mimeType}%`
        });
      }
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