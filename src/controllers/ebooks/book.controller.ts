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
  NotFoundException,
  BadRequestException,
  Request,
  Res,
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

@ApiTags('Books')
@Controller('books')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class BookController extends BaseController{
  constructor(private bookService: BookService) {
    super();
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy tất cả sách công khai (không cần đăng nhập)' })
  async getPublicBooks( @Query('page') page: number,
  @Query('size') size: number,
  @Query('search') search: string,
  @Request() req: any,
  @Res() res: Response,
  @Query('filterType') filterType?: FilterType,
  @Query('categoryId') categoryId?: number,) {
    const userId = req?.user?.id;
    try {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    
    const data = await this.bookService.getPublicBooks(filter, filterType, categoryId, userId);
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sách (cần đăng nhập)' })
  async getAllBooks() {
    return this.bookService.getAllBooks();
  }

  @Public()
  @Get('public/:id')
  @ApiOperation({ summary: 'Lấy sách công khai theo ID' })
  async getPublicBookById(@Param('id') id: number) {
    const book = await this.bookService.getBookById(id);
    if (!book || !book.isPublic) {
      throw new NotFoundException('Sách không tồn tại');
    }
    return book;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy sách theo ID' })
  async getBookById(@Param('id') id: number) {
    const book = await this.bookService.getBookById(id);
    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }
    return book;
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sách mới' })
  @HttpCode(HttpStatus.CREATED)
  async createBook(@Body() createBookDto: CreateBookDto, @Request() req) {
    try {
      return await this.bookService.createBook({ ...createBookDto, createById: req?.user?.id });
    } catch (error) {
      throw new BadRequestException('Lỗi: ' + error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sách' })
  async updateBook(@Param('id') id: number, @Body() updateBookDto: UpdateBookDto, @Request() req) {
    const book = await this.bookService.updateBook(id, { ...updateBookDto, createById: req?.user?.id });
    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }
    return book;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sách' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBook(@Param('id') id: number) {
    const deleted = await this.bookService.deleteBook(id);
    if (!deleted) {
      throw new NotFoundException('Sách không tồn tại');
    }
  }

  @Public()
  @Get('public/search')
  @ApiOperation({ summary: 'Tìm kiếm sách công khai' })
  async searchPublicBooks(@Query('keyword') keyword: string) {
    return this.bookService.searchBooks(keyword);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm tất cả sách' })
  async searchAllBooks(@Query('keyword') keyword: string) {
    return this.bookService.searchBooks(keyword);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách theo category' })
  async getBooksByCategory(@Param('categoryId') categoryId: number) {
    return this.bookService.getBooksByCategory(categoryId);
  }

  @Public()
  @Get('public/category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách công khai theo category' })
  async getPublicBooksByCategory(@Param('categoryId') categoryId: number) {
    const books = await this.bookService.getBooksByCategory(categoryId);
    return books.filter((book) => book.isPublic);
  }

  @Public()
  @Get('public/title')
  @ApiOperation({ summary: 'Tìm kiếm theo tiêu đề (công khai)' })
  async searchPublicBooksByTitle(@Query('q') q: string) {
    return this.bookService.searchByTitle(q);
  }

  @Public()
  @Get('public/author')
  @ApiOperation({ summary: 'Tìm kiếm theo tác giả (công khai)' })
  async searchPublicBooksByAuthor(@Query('q') q: string) {
    return this.bookService.searchByAuthor(q);
  }
}

