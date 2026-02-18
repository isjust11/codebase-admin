import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
  Res,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookService } from 'src/services/book.service';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { JwtAuthGuard, Public } from 'src/guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { PermissionGuard } from 'src/guards/permission.guard';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Response } from 'express';
import { FilterType } from 'src/enums/filter-type.enum';
import { MediaService } from 'src/services/media.service';

@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BookController extends BaseController {
  private readonly logger = new Logger(BookController.name);

  constructor(private bookService: BookService, private mediaService: MediaService) {
    super();
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy tất cả sách công khai (không cần đăng nhập)' })
  async getPublicBooks(@Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req: any,
    @Res() res: Response,
    @Query('filterType') filterType?: FilterType,
    @Query('categoryId') categoryId?: string,
  ) {
    const userId = req?.user?.id;
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
      };
      const categoryIdNumber = categoryId ? this.decode(categoryId) : undefined;
      const data = await this.bookService.getPublicBooks(filter, filterType, categoryIdNumber, userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sách (cần đăng nhập)' })
  async getAllBooks(@Res() res: Response) {
    try {
      const data = await this.bookService.getAllBooks();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({ summary: 'Lấy sách công khai theo ID' })
  async getPublicBookById(@Param('id') id: string, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.getBookById(bookId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy sách theo ID từ thông báo ' })
  async getBookById(@Param('id') id: string, @Res() res: Response) {
    try {
      // id từ thông báo không có mã hóa
      const bookId = this.decode(id);
      // const bookId = this.decode(id);
      const data = await this.bookService.getBookById(bookId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sách mới' })
  @HttpCode(HttpStatus.CREATED)
  async createBook(@Body() createBookDto: CreateBookDto, @Request() req, @Res() res: Response) {
    const userId = req?.user?.id;
    this.logger.log(`[createBook] POST /books - userId=${userId}, body keys=${createBookDto ? Object.keys(createBookDto).join(',') : 'null'}`);

    try {
      if (createBookDto?.category) {
        createBookDto.categoryId = this.decode(createBookDto.category);
        this.logger.debug(`[createBook] categoryId decoded`);
      }

      this.logger.debug(`[createBook] Calling bookService.createBook`);
      const data = await this.bookService.createBook({ ...createBookDto, createById: userId });
      this.logger.log(`[createBook] Success - bookId=${(data as any)?.id ?? (data as any)?.bookId ?? 'unknown'}`);
      return this.success(res, data);
    } catch (error) {
      this.logger.error(
        `[createBook] Failed - message=${error?.message ?? error}`,
        error?.stack ?? undefined,
      );
      if (error?.response) {
        this.logger.error(`[createBook] Error response: ${JSON.stringify(error.response)}`);
      }

      // Rollback: remove uploaded files (safe access - avoid throw in catch)
      const fileUrl = createBookDto?.fileUrl ? createBookDto.fileUrl.split('/').pop() : null;
      const coverImageUrl = createBookDto?.coverImageUrl ? createBookDto.coverImageUrl.split('/').pop() : null;
      if (fileUrl) {
        this.logger.warn(`[createBook] Rollback: deleting file ${fileUrl}`);
        try {
          await this.mediaService.deleteFile(fileUrl, userId);
        } catch (deleteErr) {
          this.logger.warn(`[createBook] Rollback deleteFile failed: ${deleteErr?.message}`);
        }
      }
      if (coverImageUrl) {
        this.logger.warn(`[createBook] Rollback: deleting cover ${coverImageUrl}`);
        try {
          await this.mediaService.deleteFile(coverImageUrl, userId);
        } catch (deleteErr) {
          this.logger.warn(`[createBook] Rollback deleteFile failed: ${deleteErr?.message}`);
        }
      }

      return this.error(res, error);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sách' })
  async updateBook(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto, @Request() req, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      if(updateBookDto.category) {
        updateBookDto.categoryId = this.decode(updateBookDto.category);
      }
      const data = await this.bookService.updateBook(bookId, { ...updateBookDto, createById: req?.user?.id });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sách' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBook(@Param('id') id: string, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.deleteBook(bookId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/search')
  @ApiOperation({ summary: 'Tìm kiếm sách công khai' })
  async searchPublicBooks(@Query('keyword') keyword: string, @Res() res: Response) {
    try {
      const data = await this.bookService.searchBooks(keyword);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm tất cả sách' })
  async searchAllBooks(@Query('keyword') keyword: string, @Res() res: Response) {
    try {
      const data = await this.bookService.searchBooks(keyword);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách theo category' })
  async getBooksByCategory(@Param('categoryId') categoryId: number, @Res() res: Response) {
    try {
      const data = await this.bookService.getBooksByCategory(categoryId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách công khai theo category' })
  async getPublicBooksByCategory(@Param('categoryId') categoryId: number, @Res() res: Response) {
    try {
      const data = await this.bookService.getBooksByCategory(categoryId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/title')
  @ApiOperation({ summary: 'Tìm kiếm theo tiêu đề (công khai)' })
  async searchPublicBooksByTitle(@Query('q') q: string, @Res() res: Response) {
    try {
      const data = await this.bookService.searchByTitle(q);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get('public/author')
  @ApiOperation({ summary: 'Tìm kiếm theo tác giả (công khai)' })
  async searchPublicBooksByAuthor(@Query('q') q: string, @Res() res: Response) {
    try {
      const data = await this.bookService.searchByAuthor(q);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}

