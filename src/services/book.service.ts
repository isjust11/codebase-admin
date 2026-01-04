import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.find({ relations: ['category'] });
  }

  async getPublicBooks(filter: PaginationParams, isFavorite?: boolean, isArchived?: boolean): Promise<PaginatedResponse<Book>> {
    const { page, size, search } = filter;
    const skip = ((page || 1) - 1) * (size || 10);
    const take = size;
    const query = this.bookRepository.createQueryBuilder('book')
    .where('book.isPublic = true');
    if (isFavorite) {
      query.andWhere('book.isFavorite = true');
    }
    if (isArchived) {
      query.andWhere('book.isArchived = true');
    }
    if (search) {
      query.andWhere('book.title LIKE :search OR book.author LIKE :search OR book.createBy.username LIKE :search', { search: `%${search}%` });
    }
    const [data, total] = await this.bookRepository.findAndCount({
      where: {
        title: Like(`%${search}%`),
        author: Like(`%${search}%`),
        createBy: { username: Like(`%${search}%`) },
      },
      relations: ['category'],
      skip,
      take,
    });
    return {
      data,
      total,
      page: page ?? 1,
      size: size ?? 10,
      totalPages: Math.ceil(total / (size || 10)),
    };
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
        { createBy: { username: Like(`%${keyword}%`) } },
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

