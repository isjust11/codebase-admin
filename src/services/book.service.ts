import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.find({ relations: ['category'] });
  }

  async getPublicBooks(): Promise<Book[]> {
    return this.bookRepository.find({
      where: { isPublic: true },
      relations: ['category'],
    });
  }

  async getBookById(id: number): Promise<Book | null> {
    return this.bookRepository.findOne({
      where: { id },
      relations: ['category'],
    });
  }

  async createBook(createBookDto: CreateBookDto): Promise<Book> {
    const book = this.bookRepository.create(createBookDto);
    return this.bookRepository.save(book);
  }

  async updateBook(id: number, updateBookDto: UpdateBookDto): Promise<Book | null> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return null;
    }
    Object.assign(book, updateBookDto);
    return this.bookRepository.save(book);
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await this.bookRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async searchBooks(keyword: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: [
        { title: Like(`%${keyword}%`), isPublic: true },
        { author: Like(`%${keyword}%`), isPublic: true },
      ],
      relations: ['category'],
    });
  }

  async searchByTitle(title: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { title: Like(`%${title}%`), isPublic: true },
      relations: ['category'],
    });
  }

  async searchByAuthor(author: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { author: Like(`%${author}%`), isPublic: true },
      relations: ['category'],
    });
  }

  async getBooksByCategory(categoryId: number): Promise<Book[]> {
    return this.bookRepository.find({
      where: { categoryId },
      relations: ['category'],
    });
  }
}

