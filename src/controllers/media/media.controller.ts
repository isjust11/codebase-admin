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

@Controller('media')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class MediaController extends BaseController{
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
  async findOne(@Param('id') id: string, @Request() req): Promise<Media> {
    return this.mediaService.findById(this.decode(id), req.user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile()
    file: Express.Multer.File,
    @Request() req,
  ): Promise<Media> {
    const maxSize = Number(this.configService.get('MAX_FILE_SIZE') || 10485760);
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds the maximum allowed size of ${maxSize / 1024 / 1024}MB`);
    }
    // validate file type
    const allowedTypes = this.configService.get('ALLOWED_FILE_TYPES')?.split(',') || ['jpg', 'jpeg', 'png', 'gif', 'mp3', 'wav', 'm4a', 'aac', 'ogg', 'flac', 'mp4', 'mov', 'wmv', 'avi', 'flv', 'mkv', 'webm', 'webp', 'mpeg', 'mpg', '3gp', 'm4v', 'pdf', 'epub', 'mobi'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(`File type ${file.mimetype} is not allowed`);
    }
    return this.mediaService.upload(file, req.user);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'media')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @Request() req,
  ): Promise<Media> {
    return this.mediaService.update(this.decode(id), updateMediaDto, req.user.id);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'media')
  @HttpCode(204)  
  async delete(@Param('filename') filename: string, @Request() req,): Promise<{ success: boolean, message?: string }> {
    try {
      await this.mediaService.deleteFile(filename, req.user.id);
      return { success: true };
    } catch (error) {
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
    } catch (error) {
      return { success: false, message: error.message };
    }
   
  }
} 