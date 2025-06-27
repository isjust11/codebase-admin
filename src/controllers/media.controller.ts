import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, UseInterceptors, UploadedFile, ParseFilePipe, MaxFileSizeValidator, FileTypeValidator, Request, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MediaService } from '../services/media.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Media } from '../entities/media.entity';
import { UpdateMediaDto } from '../dtos/media.dto';
import { PaginationParams } from 'src/dtos/filter.dto';

@Controller('media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @Get()
  async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.mediaService.findAllWithPagination(filter);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Media> {
    return this.mediaService.findById(parseInt(id), req.user.id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 10 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|mp4|mp3|pdf)$/i }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Request() req,
  ): Promise<Media> {
    return this.mediaService.uploadFile(file, req.user.id);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMediaDto: UpdateMediaDto,
    @Request() req,
  ): Promise<Media> {
    return this.mediaService.update(parseInt(id), updateMediaDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    return this.mediaService.deleteFile(parseInt(id), req.user.id);
  }
} 