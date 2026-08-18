import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Request, Query, HttpCode, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../../services/media.service';
import { Media } from '../../entities/media.entity';
import { UpdateMediaDto } from '../../dtos/media.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard, Public } from 'src/guards/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('media')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MediaController extends BaseController {
  constructor(private mediaService: MediaService, private configService: ConfigService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'media')
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string,
    @Query('mimeType') mimeType: string
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 100,
      search: search || '',
      mimeType: mimeType || ''
    };
    return await this.mediaService.findAllWithPagination(filter);
  }

  @Get(':id')
  @RequirePermission('READ', 'media')
  async findOne(@Param('id') id: string, @Locale() locale: SupportedLocale, @Request() req): Promise<Media> {
    return this.mediaService.findById(this.decode(id), req.user.id, locale);
  }

  /**
   * Upload tài nguyên hệ thống (svg category, banner, icon dùng chung,...).
   * Yêu cầu quyền CREATE 'media' (mặc định chỉ admin có).
   *
   * Query: `subfolder` ∈ categories | icons | banners | placeholders | general
   * Trả về Media có `publicRelativePath` để FE/Mobile lưu vào entity tương ứng
   * (vd category.image).
   */
  @Post('upload-system')
  @RequirePermission('CREATE', 'media')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSystemAsset(
    @UploadedFile()
    file: Express.Multer.File,
    @Query('subfolder') subfolder: string,
    @Request() req,
  ): Promise<Media> {
    return this.mediaService.uploadSystemAsset(
      file,
      subfolder || 'general',
      req.user,
    );
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Request() req,
  ): Promise<Media> {
    try {
      if (!file) {
        throw new BadRequestException('No file uploaded');
      }

      // Validate file size
      const maxSize = Number(this.configService.get('MAX_FILE_SIZE') || 10485760); // 10MB default
      // if (file.size > maxSize) {
      //   throw new BadRequestException(`File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`);
      // }

      // Validate file type by extension (more reliable than mimetype)
      const allowedExtensions = this.configService.get('ALLOWED_FILE_EXTENSIONS')?.split(',') ||
        ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac',
          'mp4', 'mov', 'wmv', 'avi', 'flv', 'mkv', 'webm', 'mpeg', 'mpg', '3gp', 'm4v',
          'pdf', 'epub', 'mobi'];

      // Extract file extension from filename
      const fileExtension = file.originalname.split('.').pop()?.toLowerCase();

      if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `File type ".${fileExtension}" is not allowed. Allowed types: ${allowedExtensions.join(', ')}`
        );
      }

      return this.mediaService.upload(file, req.user);
    } catch (error) {
      throw error;
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'media')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @Locale() locale: SupportedLocale,
    @Request() req,
  ): Promise<Media> {
    return this.mediaService.update(this.decode(id), updateMediaDto, req.user.id, locale);
  }

  @Delete(':filename')
  @RequirePermission('DELETE', 'media')
  @HttpCode(204)
  async delete(@Param('filename') filename: string, @Request() req,): Promise<{ success: boolean, message?: string }> {
    try {
      await this.mediaService.deleteFile(filename, req.user.id);
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  @Delete()
  @RequirePermission('DELETE', 'media')
  @HttpCode(204)
  async deleteMultiple(@Body() filenames: string[], @Request() req): Promise<{ success: boolean, message?: string }> {
    try {
      filenames.forEach(filename => this.mediaService.deleteFile(filename, req.user.id));
      return { success: true };
    } catch (error: any) {
      return { success: false, message: error.message };
    }

  }
}