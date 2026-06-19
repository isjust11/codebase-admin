import { Controller, Get, Param, Res } from '@nestjs/common';
import { Public } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import * as path from 'path';
import * as fs from 'fs';

@Controller()
export class HomeController {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) { }

  @Public()
  @Get()
  async getHome(@Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'public', 'pages', 'home.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Home page not found');
    }
    return res.sendFile(filePath);
  }

  @Public()
  @Get('book-detail')
  async getBookDetailPage(@Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'public', 'pages', 'book-detail.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Book detail page not found');
    }
    return res.sendFile(filePath);
  }

  /**
   * API công khai trả về đúng 12 ebook mới nhất cho trang chủ.
   * Không phân quyền, không phân trang.
   */
  @Public()
  @Get('api/showcase')
  async getShowcaseBooks(@Res() res: Response) {
    try {
      const books = await this.bookRepository
        .createQueryBuilder('book')
        .leftJoinAndSelect('book.category', 'category')
        .leftJoinAndSelect('book.files', 'files')
        .where('book.isPublic = :isPublic', { isPublic: true })
        .andWhere('files.id IS NOT NULL')
        .orderBy('book.createdAt', 'DESC')
        .take(12)
        .getMany();

      return res.json({ status: true, data: books });
    } catch (error) {
      return res.status(500).json({ status: false, message: 'Lỗi tải danh sách sách.' });
    }
  }

  /**
   * API công khai trả về chi tiết 1 ebook theo ID (kèm files).
   * Không phân quyền, không cần token.
   */
  @Public()
  @Get('api/book/:id')
  async getBookDetail(@Param('id') id: string, @Res() res: Response) {
    try {
      const bookId = parseInt(id, 10);
      if (isNaN(bookId)) {
        return res.status(400).json({ status: false, message: 'ID không hợp lệ.' });
      }

      const book = await this.bookRepository.findOne({
        where: { id: bookId, isPublic: true },
        relations: ['category', 'files'],
      });

      if (!book) {
        return res.status(404).json({ status: false, message: 'Không tìm thấy sách.' });
      }

      return res.json({ status: true, data: book });
    } catch (error) {
      return res.status(500).json({ status: false, message: 'Lỗi tải thông tin sách.' });
    }
  }
}
