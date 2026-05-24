import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Media } from '../entities/media.entity';
import { UploadMediaDto, UpdateMediaDto } from '../dtos/media.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { User } from 'src/entities/user.entity';
import imageSize from 'image-size';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Subfolders cho phép khi upload system asset. Whitelist để tránh user lách
 * đường dẫn (path traversal, ghi đè asset của module khác,...).
 */
export const ALLOWED_SYSTEM_SUBFOLDERS = [
  'categories',
  'icons',
  'banners',
  'placeholders',
  'general',
] as const;
export type SystemSubfolder = (typeof ALLOWED_SYSTEM_SUBFOLDERS)[number];

/**
 * Loại file được phép cho system asset. Cho thêm svg/json so với upload thường
 * vì admin cần upload các icon vector cho category.
 */
const ALLOWED_SYSTEM_EXTENSIONS = [
  'svg',
  'png',
  'jpg',
  'jpeg',
  'webp',
  'gif',
  'json',
];

@Injectable()
export class MediaService {
  private s3Client: S3Client;
  private bucketName: string;
  private endpoint: string;

  constructor(
    @InjectRepository(Media)
    private mediaRepository: Repository<Media>,
    private readonly configService: ConfigService,
  ) {
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || 'readbox-storage';
    this.endpoint = this.configService.get<string>('S3_ENDPOINT') || '';
    this.s3Client = new S3Client({
      region: this.configService.get<string>('S3_REGION') || 'us-east-1',
      endpoint: this.endpoint,
      credentials: {
        accessKeyId: this.configService.get<string>('S3_ACCESS_KEY_ID') || '',
        secretAccessKey: this.configService.get<string>('S3_SECRET_ACCESS_KEY') || '',
      },
      forcePathStyle: true,
    });
  }

  async buildPublicUrl(key: string): Promise<string> {
    if (this.endpoint.includes('amazonaws.com') && !this.configService.get('S3_FORCE_PATH_STYLE')) {
      return `https://${this.bucketName}.s3.${this.configService.get<string>('S3_REGION')}.amazonaws.com/${key}`;
    }
    return `${this.endpoint.replace(/\/$/, '')}/${this.bucketName}/${key}`;
  }

  async findAll(userId: number): Promise<Media[]> {
    const medias = await this.mediaRepository.find({
      where: { isDeleted: false, userId },
    });
    for (const m of medias) {
      if (m.filename) {
        m.url = await this.buildPublicUrl(m.filename);
      }
    }
    return medias;
  }

  async findById(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Media> {
    const media = await this.mediaRepository.findOne({
      where: { id, userId },
    });
    if (!media) {
      throw new NotFoundException(getMessages(locale).multiImage.notFound);
    }
    if (media.filename) {
      media.url = await this.buildPublicUrl(media.filename);
    }
    return media;
  }

  async create(createMediaDto: UploadMediaDto): Promise<Media> {
    const media = this.mediaRepository.create(createMediaDto);
    return this.mediaRepository.save(media);
  }

  async update(id: number, updateMediaDto: UpdateMediaDto, userId: number, locale: SupportedLocale = 'vi'): Promise<Media> {
    const media = await this.findById(id, userId, locale);
    Object.assign(media, updateMediaDto);
    return this.mediaRepository.save(media);
  }

  async remove(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<void> {
    const media = await this.findById(id, userId, locale);
    await this.mediaRepository.remove(media);
  }

  async updateMediaFile(id: number, file: Express.Multer.File, user: User, locale: SupportedLocale = 'vi'): Promise<Media> {
    const media = await this.findById(id, user.id, locale);
    const oldFilename = media.filename;

    if (oldFilename) {
      try {
        await this.deleteFile(oldFilename, user.id);
      } catch (_err) {
        // ignore delete errors
      }
    }

    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g, '_')}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: uniqueFilename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));

    const publicUrl = await this.buildPublicUrl(uniqueFilename);

    let width: number | null = null;
    let height: number | null = null;
    if (file.mimetype.startsWith('image/')) {
      try {
        const dimensions = imageSize(file.buffer);
        width = dimensions.width || null;
        height = dimensions.height || null;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    media.filename = uniqueFilename;
    media.originalName = file.originalname;
    media.mimeType = file.mimetype;
    media.size = file.size;
    media.width = width;
    media.height = height;
    media.path = publicUrl;
    media.url = publicUrl;
    media.publicRelativePath = publicUrl;

    return this.mediaRepository.save(media);
  }

  async deleteFile(filename: string, userId: number): Promise<void> {
    try {
      if (filename) {
        const filePath = `user-files/${userId}/${filename}`;
        await this.s3Client.send(new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: filePath,
        }));
      }
    } catch (_error) {
      throw new Error(`Failed to delete file: ${_error.message}`);
    }
  }

  // delete userdata
  async deleteUserData(userId: number): Promise<void> {
    try {
      const result = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `user-files/${userId}/`,
      }));
      const files = result.Contents?.map((item) => item.Key) || [];
      if (files.length > 0) {
        await this.s3Client.send(new DeleteObjectsCommand({
          Bucket: this.bucketName,
          Delete: {
            Objects: files.map((key) => ({ Key: key || '' })),
          },
        }));
      }
    } catch (_error) {
      throw new Error(`Failed to delete user data: ${_error.message}`);
    }
  }

  // lấy dung lượng lưu trữ thực tế của user
  async getUserStorageUsedData(userId: number): Promise<{ usedSize: number; } | null> {
    try {
      const result = await this.s3Client.send(new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: `user-files/${userId}/`,
      }));
      const usedSize = result.Contents?.reduce((acc, item) => acc + (item.Size || 0), 0) || 0;
      return {
        usedSize,
      };
    } catch {
      return null;
    }
  }

  async uploadFromBuffer(buffer: Buffer, originalName: string, mimeType: string, folder: string = 'system', userId?: number): Promise<Media> {
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${originalName.replace(/\s+/g, '_')}`;
    const key = userId ? `${folder}/${userId}/${uniqueFilename}` : `${folder}/${uniqueFilename}`;

    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      ACL: 'public-read',
    }));

    const publicUrl = await this.buildPublicUrl(key);

    let width: number = 0;
    let height: number = 0;
    if (mimeType.startsWith('image/')) {
      try {
        const dimensions = imageSize(buffer);
        width = dimensions.width || 0;
        height = dimensions.height || 0;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    const media = new Media();
    media.filename = key;
    media.originalName = originalName;
    media.mimeType = mimeType;
    media.size = buffer.length;
    media.width = width;
    media.height = height;
    media.path = publicUrl;
    media.url = publicUrl;
    media.publicRelativePath = publicUrl;
    if (userId) {
      media.userId = userId;
    }
    return this.mediaRepository.save(media);
  }

  /**
   * Upload tài nguyên dùng chung cho hệ thống (svg category, banner cố định,...).
   * - Lưu dưới `system/<subfolder>/<filename>` — KHÔNG có userId trong path để
   *   nhiều admin cùng quản lý chung 1 thư mục.
   * - Vẫn ghi `userId` vào record Media để truy vết ai đã upload.
   * - Cho phép thêm svg + json so với upload user thường.
   * - Cache lâu (1 năm) vì asset hệ thống ít thay đổi.
   */
  async uploadSystemAsset(
    file: Express.Multer.File,
    subfolder: string,
    uploader: User,
  ): Promise<Media> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const folder = (subfolder || 'general').toLowerCase();
    if (!ALLOWED_SYSTEM_SUBFOLDERS.includes(folder as SystemSubfolder)) {
      throw new BadRequestException(
        `Invalid subfolder "${folder}". Allowed: ${ALLOWED_SYSTEM_SUBFOLDERS.join(', ')}`,
      );
    }

    const ext = file.originalname.split('.').pop()?.toLowerCase();
    if (!ext || !ALLOWED_SYSTEM_EXTENSIONS.includes(ext)) {
      throw new BadRequestException(
        `File type ".${ext}" is not allowed for system upload. Allowed: ${ALLOWED_SYSTEM_EXTENSIONS.join(', ')}`,
      );
    }

    const safeName = file.originalname.replace(/\s+/g, '_');
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
    const key = `system/${folder}/${uniqueFilename}`;

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype || 'application/octet-stream',
        ACL: 'public-read',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    const publicUrl = await this.buildPublicUrl(key);

    let width = 0;
    let height = 0;
    // SVG không đo bằng image-size được, bỏ qua. JSON không phải ảnh.
    if (
      file.mimetype.startsWith('image/') &&
      file.mimetype !== 'image/svg+xml'
    ) {
      try {
        const dim = imageSize(file.buffer);
        width = dim.width || 0;
        height = dim.height || 0;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    const media = new Media();
    media.filename = key;
    media.originalName = file.originalname;
    media.mimeType = file.mimetype || 'application/octet-stream';
    media.size = file.size;
    media.width = width;
    media.height = height;
    media.path = publicUrl;
    media.url = publicUrl;
    media.publicRelativePath = publicUrl;
    media.userId = uploader.id;
    return this.mediaRepository.save(media);
  }

  async upload(file: Express.Multer.File, user: User): Promise<Media> {
    const uniqueFilename = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname.replace(/\s+/g, '_')}`;
    const key = `user-files/${user.id}/${uniqueFilename}`;
    await this.s3Client.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    }));

    const publicUrl = await this.buildPublicUrl(key);

    let width: number = 200;
    let height: number = 200;
    if (file.mimetype.startsWith('image/')) {
      try {
        const dimensions = imageSize(file.buffer);
        if (dimensions.width) width = dimensions.width;
        if (dimensions.height) height = dimensions.height;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
      }
    }

    const newMedia = new Media();
    newMedia.filename = key;
    newMedia.originalName = file.originalname;
    newMedia.mimeType = file.mimetype;
    newMedia.size = file.size;
    newMedia.width = width;
    newMedia.height = height;
    newMedia.path = publicUrl;
    newMedia.url = publicUrl;
    newMedia.user = user;
    newMedia.userId = user?.id;
    newMedia.publicRelativePath = publicUrl;

    return newMedia;
  }

  async getFileInfo(filename: string, userId: number): Promise<{ size: number; mimeType: string } | null> {
    try {
      const result = await this.s3Client.send(new HeadObjectCommand({
        Bucket: this.bucketName,
        Key: filename,
      }));
      return {
        size: result.ContentLength || 0,
        mimeType: result.ContentType || 'application/octet-stream',
      };
    } catch {
      return null;
    }
  }

  async getUserSizeData(userId: number): Promise<{ totalSize: number } | null> {
    return { totalSize: 0 };
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<Media>> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucketName,
    });

    try {
      const s3Response = await this.s3Client.send(command);
      let contents = s3Response.Contents || [];

      contents = contents.filter(item => item.Key && !item.Key.endsWith('/'));
      contents.sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

      if (params.search) {
        contents = contents.filter(item => item.Key!.toLowerCase().includes(params.search!.toLowerCase()));
      }

      const page = Number(params.page) || 1;
      const size = Number(params.size) || 100;
      const total = contents.length;

      const paginatedContents = contents.slice((page - 1) * size, page * size);

      const data = await Promise.all(paginatedContents.map(async item => {
        const extension = item.Key!.split('.').pop()?.toLowerCase();
        let mimeType = 'application/octet-stream';
        if (['jpg', 'jpeg'].includes(extension!)) mimeType = 'image/jpeg';
        else if (extension === 'png') mimeType = 'image/png';
        else if (extension === 'gif') mimeType = 'image/gif';
        else if (extension === 'webp') mimeType = 'image/webp';
        else if (extension === 'pdf') mimeType = 'application/pdf';
        else if (extension === 'mp3') mimeType = 'audio/mpeg';
        else if (extension === 'mp4') mimeType = 'video/mp4';

        const publicUrl = await this.buildPublicUrl(item.Key!);

        return {
          id: 0,
          originalName: item.Key,
          mimeType,
          size: item.Size,
          url: publicUrl,
          path: publicUrl,
          filename: item.Key,
          isDeleted: false,
          createdAt: item.LastModified,
          updatedAt: item.LastModified,
        } as any;
      }));

      return {
        data: data,
        total,
        page,
        size,
        totalPages: Math.ceil(total / size),
      };
    } catch (error) {
      console.error('Error listing S3 objects:', error);
      return {
        data: [],
        total: 0,
        page: params.page || 1,
        size: params.size || 100,
        totalPages: 0,
      };
    }
  }
}
