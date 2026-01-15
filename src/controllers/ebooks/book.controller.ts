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
  async getPublicBookById(@Param('id') id: number, @Res() res: Response) {
    try {
      const data = await this.bookService.getBookById(id);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy sách theo ID' })
  async getBookById(@Param('id') id: number, @Res() res: Response) {
    try {
      const data = await this.bookService.getBookById(id);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Tạo sách mới' })
  @HttpCode(HttpStatus.CREATED)
  async createBook(@Body() createBookDto: CreateBookDto, @Request() req, @Res() res: Response) {
    try { 
      const data = await this.bookService.createBook({ ...createBookDto, createById: req?.user?.id });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật sách' })
  async updateBook(@Param('id') id: number, @Body() updateBookDto: UpdateBookDto, @Request() req, @Res() res: Response) {
    try {
      const data = await this.bookService.updateBook(id, { ...updateBookDto, createById: req?.user?.id });
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa sách' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteBook(@Param('id') id: number, @Res() res: Response) {
    try {
      const data = await this.bookService.deleteBook(id);
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

