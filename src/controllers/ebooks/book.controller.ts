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
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BookService } from 'src/services/book.service';
import { AddBookFormatDto, CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { BulkBookIdsDto, BulkBookStatusDto } from 'src/dtos/book-bulk.dto';
import { JwtAuthGuard, Public } from 'src/guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { PermissionGuard } from 'src/guards/permission.guard';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Response } from 'express';
import { FilterType } from 'src/enums/filter-type.enum';
import { MediaService } from 'src/services/media.service';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { RoleService } from 'src/services/role.service';
import { RoleEnum } from 'src/enums/role.enum';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BookController extends BaseController {
  private readonly logger = new Logger(BookController.name);

  constructor(private bookService: BookService,
    private mediaService: MediaService,
    private readonly roleService: RoleService
  ) {
    super();
  }

  @Post('bulk/delete')
  @RequirePermission('DELETE', 'EBOOK')
  @ApiOperation({ summary: 'Xóa nhiều sách' })
  async bulkDelete(@Body() dto: BulkBookIdsDto, @Res() res: Response) {
    try {
      const ids = dto.ids.map((id) => this.decode(id));
      const data = await this.bookService.bulkDeleteBooks(ids);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('bulk/status')
  @RequirePermission('UPDATE', 'EBOOK')
  @ApiOperation({ summary: 'Cập nhật trạng thái nhiều sách' })
  async bulkUpdateStatus(
    @Body() dto: BulkBookStatusDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const ids = dto.ids.map((id) => this.decode(id));
      const data = await this.bookService.bulkUpdateStatus(ids, dto.statusCode, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('admin/statistics')
  @RequirePermission('READ', 'EBOOK')
  @ApiOperation({ summary: 'Thống kê sách cho admin' })
  async getStatistics(@Res() res: Response) {
    try {
      const data = await this.bookService.getStatistics();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('admin')
  @RequirePermission('READ', 'EBOOK')
  @ApiOperation({ summary: 'Lấy tất cả sách (cần đăng nhập)' })
  async getAdminBooks(@Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req: any,
    @Res() res: Response,
    @Query('filterType') filterType?: FilterType,
    @Query('categoryId') categoryId?: string,
  ) {
    const userId = req?.user?.id;
    let isSupperAdmin = false;
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
      };
      if (req?.user?.roles?.length > 0) {
        const role = await this.roleService.findById(req?.user?.roles[0]);
        isSupperAdmin = role?.code === RoleEnum.SUPPER_ADMIN;
      }
      const categoryIdNumber = categoryId ? this.decode(categoryId) : undefined;
      const data = await this.bookService.getPublicBooks(filter, filterType, categoryIdNumber, userId, isSupperAdmin, undefined, req?.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy tất cả sách công khai' })
  async getPublicBooks(@Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Request() req: any,
    @Res() res: Response,
    @Query('filterType') filterType?: FilterType,
    @Query('categoryId') categoryId?: string,
    @Query('statusCode') statusCode?: string,
    @Query('orderBy') orderBy?: string,
    @Query('orderByType') orderByType?: string,
  ) {
    const userId = req?.user?.id;
    let isSupperAdmin = false;
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: search || '',
        orderBy: orderBy || 'createdAt',
        orderByType: orderByType || 'desc',
      };
      if (req?.user?.roles.length > 0) {
        const role = await this.roleService.findById(req?.user?.roles[0]);
        isSupperAdmin = role?.code === RoleEnum.SUPPER_ADMIN;
      }
      const categoryIdNumber = categoryId ? this.decode(categoryId) : undefined;
      const data = await this.bookService.getPublicBooks(filter, filterType, categoryIdNumber, userId, isSupperAdmin, statusCode, req?.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('discover/newest')
  @ApiOperation({ summary: 'Discover - Ebook mới (sort theo createdAt desc)' })
  async getDiscoverNewest(
    @Query('page') page: number,
    @Query('size') size: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: '',
      };
      const data = await this.bookService.getNewestBooks(filter, req?.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('discover/popular')
  @ApiOperation({ summary: 'Discover - Ebook được yêu thích nhiều nhất' })
  async getDiscoverPopular(
    @Query('page') page: number,
    @Query('size') size: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: '',
      };
      const data = await this.bookService.getPopularBooks(filter, req?.user);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('discover/recommended')
  @ApiOperation({ summary: 'Discover - Gợi ý cho bạn (dựa theo lịch sử tương tác)' })
  async getDiscoverRecommended(
    @Query('page') page: number,
    @Query('size') size: number,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const filter: PaginationParams = {
        page: page || 1,
        size: size || 10,
        search: '',
      };
      const data = await this.bookService.getRecommendedBooks(filter, req?.user?.id, req?.user);
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
  async createBook(@Body() createBookDto: CreateBookDto, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    const userId = req?.user?.id;
    this.logger.log(`[createBook] POST /books - userId=${userId}`);

    try {
      if (createBookDto?.category) {
        createBookDto.categoryId = this.decode(createBookDto.category);
      }

      // add region code
      createBookDto.region = req?.user?.region;
      createBookDto.countryCode = req?.user?.countryCode;

      const data = await this.bookService.createBook({ ...createBookDto, createById: userId }, locale);
      this.logger.log(`[createBook] Success - bookId=${(data as any)?.id ?? 'unknown'}`);
      return this.success(res, data);
    } catch (error) {
      this.logger.error(`[createBook] Failed - ${error?.message ?? error}`, error?.stack);

      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        return res.status(error.getStatus()).json({
          status: false,
          message: error.message,
          code: error.getStatus(),
        });
      }

      const fileUrl = createBookDto?.fileUrl ? createBookDto.fileUrl.split('/').pop() : null;
      const coverImageUrl = createBookDto?.coverImageUrl ? createBookDto.coverImageUrl.split('/').pop() : null;
      if (fileUrl) {
        try { await this.mediaService.deleteFile(fileUrl, userId); } catch { }
      }
      if (coverImageUrl) {
        try { await this.mediaService.deleteFile(coverImageUrl, userId); } catch { }
      }

      return this.error(res, error);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sách' })
  async updateBook(@Param('id') id: string, @Body() updateBookDto: UpdateBookDto, @Request() req, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      if (updateBookDto.category) {
        updateBookDto.categoryId = this.decode(updateBookDto.category);
      }
      const data = await this.bookService.updateBook(bookId, { ...updateBookDto, createById: req?.user?.id }, locale);
      return this.success(res, data);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof ForbiddenException) {
        return res.status(error.getStatus()).json({
          status: false,
          message: error.message,
          code: error.getStatus(),
        });
      }
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

  @Post(':id/approve')
  @RequirePermission('UPDATE', 'EBOOK')
  @ApiOperation({ summary: 'Duyệt sách' })
  async approveBook(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.updateStatus(bookId, CategoryCodeEnum.BOOK_STATUS_APPROVED, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/reject')
  @RequirePermission('UPDATE', 'EBOOK')
  @ApiOperation({ summary: 'Từ chối sách' })
  async rejectBook(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.updateStatus(bookId, CategoryCodeEnum.BOOK_STATUS_REJECTED, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Public()
  @Get(':id/files')
  @ApiOperation({ summary: 'Lấy danh sách định dạng file của sách (pdf, epub, mobi…)' })
  async getBookFiles(@Param('id') id: string, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.getFilesOfBook(bookId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/files')
  @RequirePermission('UPDATE', 'EBOOK')
  @ApiOperation({ summary: 'Thêm 1 định dạng mới cho sách đã tồn tại' })
  async addBookFormat(
    @Param('id') id: string,
    @Body() dto: AddBookFormatDto,
    @Locale() locale: SupportedLocale,
    @Res() res: Response,
  ) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.addFormat(bookId, dto, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id/status')
  @RequirePermission('UPDATE', 'EBOOK')
  @ApiOperation({ summary: 'Cập nhật trạng thái sách' })
  async updateStatus(@Param('id') id: string, @Body('statusCode') statusCode: CategoryCodeEnum, @Locale() locale: SupportedLocale, @Res() res: Response) {
    try {
      const bookId = this.decode(id);
      const data = await this.bookService.updateStatus(bookId, statusCode, locale);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

}
