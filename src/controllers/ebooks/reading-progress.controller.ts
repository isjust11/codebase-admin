import {
  Controller,
  Get,
  Post,
  Put,
  Query,
  Param,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { ReadingProgressService } from 'src/services/reading-progress.service';

@ApiTags('Reading Progress')
@Controller('api/reading-progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ReadingProgressController extends BaseController{
  constructor(private readingProgressService: ReadingProgressService) {
    super();
  }

  @Post()
  @ApiOperation({ summary: 'Lưu hoặc cập nhật tiến độ đọc' })
  async saveProgress(
    @Query('bookId') bookId: number,
    @Query('currentPage') currentPage: number,
    @Req() req: any,
  ) {
    try {
      return await this.readingProgressService.saveOrUpdateProgress(
        req.user.id,
        bookId,
        currentPage,
      );
    } catch (error) {
      throw new BadRequestException('Lỗi: ' + error.message);
    }
  }

  @Get('book/:bookId')
  @ApiOperation({ summary: 'Lấy tiến độ đọc của một cuốn sách' })
  async getProgress(@Param('bookId') bookId: number, @Req() req: any) {
    const progress = await this.readingProgressService.getProgress(
      req.user.id,
      bookId,
    );
    if (!progress) {
      throw new NotFoundException('Không tìm thấy tiến độ đọc');
    }
    return progress;
  }

  @Get('my-books')
  @ApiOperation({ summary: 'Lấy tất cả sách đã đọc của user' })
  async getMyBooks(@Req() req: any) {
    return this.readingProgressService.getUserProgress(req.user.id);
  }

  @Get('finished')
  @ApiOperation({ summary: 'Lấy sách đã đọc xong' })
  async getFinishedBooks(@Req() req: any) {
    return this.readingProgressService.getUserFinishedBooks(req.user.id);
  }

  @Put('reading-time')
  @ApiOperation({ summary: 'Cập nhật thời gian đọc' })
  async updateReadingTime(
    @Query('bookId') bookId: number,
    @Query('minutes') minutes: number,
    @Req() req: any,
  ) {
    const progress = await this.readingProgressService.updateReadingTime(
      req.user.id,
      bookId,
      minutes,
    );
    if (!progress) {
      throw new NotFoundException('Không tìm thấy tiến độ đọc');
    }
    return progress;
  }
}

