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
import FormData = require('form-data');

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

  async deleteFile(filename: string, userId: number): Promise<void> {
    try {
      if (filename) {
        try {
          await axios.delete(`${this.storageServiceUrl}/storage/file/${filename}`, {
            headers: { [this.storageClientHeaderName]: this.storageClientKey },
          });
        } catch (_err) {
          // Ignore remote not found
        }
      }
    } catch (_error) {
      throw new Error(`Failed to delete file: ${_error.message}`);
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
    const stored = uploadRes.data as { filename: string; size: number; mimeType: string; url: string, publicUrl: string };

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
    newMedia.path = stored.publicUrl; // keep relative
    newMedia.url = this.buildAbsoluteUrl(stored.publicUrl);
    newMedia.user = user;
    newMedia.userId = user?.id;
    newMedia.publicRelativePath = stored.publicUrl;

    // await this.mediaRepository.save(newMedia);
    return newMedia;
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Media>> {
   const listRes = await axios.get(`${this.storageServiceUrl}/storage/list`,{
      headers: { [this.storageClientHeaderName]: this.storageClientKey },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    const data = listRes.data.map((item: { filename: string; size: number; mimeType: string; url: string, publicUrl: string, uploadedAt: string }) => ({
      ...item,
      id: 0,
      originalName: item.filename,
      mimeType: item.mimeType,
      size: item.size,
      url: this.buildAbsoluteUrl(item.publicUrl),
      path: item.publicUrl,
      filename: item.filename,
      isDeleted: false,
      createdAt: new Date(item.uploadedAt),
      updatedAt: new Date(),
    }));
    return {
      data: data,
      total: data.length,
      page: 1,
      size: data.length,
      totalPages: 1,
    };
  }
} 