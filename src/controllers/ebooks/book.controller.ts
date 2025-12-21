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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BookService } from 'src/services/book.service';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';

@ApiTags('Books')
@Controller('books')
export class BookController extends BaseController{
  constructor(private bookService: BookService) {
    super();
  }

  @Get('public')
  @ApiOperation({ summary: 'Lấy tất cả sách công khai (không cần đăng nhập)' })
  async getPublicBooks() {
    return this.bookService.getPublicBooks();
  }

  @Get()
  @ApiOperation({ summary: 'Lấy tất cả sách (cần đăng nhập)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getAllBooks() {
    return this.bookService.getAllBooks();
  }

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
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getBookById(@Param('id') id: number) {
    const book = await this.bookService.getBookById(id);
    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }
    return book;
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sách mới' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createBook(@Body() createBookDto: CreateBookDto) {
    try {
      return await this.bookService.createBook(createBookDto);
    } catch (error) {
      throw new BadRequestException('Lỗi: ' + error.message);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sách' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateBook(@Param('id') id: number, @Body() updateBookDto: UpdateBookDto) {
    const book = await this.bookService.updateBook(id, updateBookDto);
    if (!book) {
      throw new NotFoundException('Sách không tồn tại');
    }
    return book;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sách' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBook(@Param('id') id: number) {
    const deleted = await this.bookService.deleteBook(id);
    if (!deleted) {
      throw new NotFoundException('Sách không tồn tại');
    }
  }

  @Get('public/search')
  @ApiOperation({ summary: 'Tìm kiếm sách công khai' })
  async searchPublicBooks(@Query('keyword') keyword: string) {
    return this.bookService.searchBooks(keyword);
  }

  @Get('search')
  @ApiOperation({ summary: 'Tìm kiếm tất cả sách' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async searchAllBooks(@Query('keyword') keyword: string) {
    return this.bookService.searchBooks(keyword);
  }

  @Get('category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách theo category' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getBooksByCategory(@Param('categoryId') categoryId: number) {
    return this.bookService.getBooksByCategory(categoryId);
  }

  @Get('public/category/:categoryId')
  @ApiOperation({ summary: 'Lấy sách công khai theo category' })
  async getPublicBooksByCategory(@Param('categoryId') categoryId: number) {
    const books = await this.bookService.getBooksByCategory(categoryId);
    return books.filter((book) => book.isPublic);
  }

  @Get('public/title')
  @ApiOperation({ summary: 'Tìm kiếm theo tiêu đề (công khai)' })
  async searchPublicBooksByTitle(@Query('q') q: string) {
    return this.bookService.searchByTitle(q);
  }

  @Get('public/author')
  @ApiOperation({ summary: 'Tìm kiếm theo tác giả (công khai)' })
  async searchPublicBooksByAuthor(@Query('q') q: string) {
    return this.bookService.searchByAuthor(q);
  }
}

