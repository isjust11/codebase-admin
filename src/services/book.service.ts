import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { FilterType } from 'src/enums/filter-type.enum';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionType } from 'src/enums/interaction-type.enum';
import { InteractionTarget } from 'src/enums/interaction-target.enum';
import { UserInteractionService } from './user-interaction.service';

@Injectable()
export class BookService {
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
  ) {}

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.find({ relations: ['category'] });
  }

  async getPublicBooks(filter: PaginationParams, filterType?: FilterType, categoryId?: number): Promise<PaginatedResponse<Book>> {
    const { page, size, search } = filter;
    const skip = ((page || 1) - 1) * (size || 10);
    const take = size;
    const query = this.bookRepository.createQueryBuilder('book')
    .leftJoinAndSelect('book.category', 'category')
    // .leftJoin(UserInteraction, 'user_interaction', 'user_interaction.targetId = book.id AND user_interaction.targetType = :targetType', { targetType: InteractionTarget.BOOK })
    .where('book.isPublic = true');
    if (filterType) {
      if (filterType === FilterType.FAVORITE) {
        query.andWhere('user_interaction.interactionType = :interactionType', { interactionType: InteractionType.FAVORITE });
      } else if (filterType === FilterType.ARCHIVED) {
        query.andWhere('user_interaction.interactionType = :interactionType', { interactionType: InteractionType.ARCHIVE });
      } else {
        // query.andWhere('user_interaction.interactionType = :interactionType', { interactionType: InteractionType.PUBLIC });
      }
    }
    if (categoryId) {
      query.andWhere('book.categoryId = :categoryId', { categoryId });
    }
    if (search) {
      query.andWhere('book.title LIKE :search OR book.author LIKE :search', { search: `%${search}%` });
    }
    const [data, total] = await query.skip(skip).take(take).getManyAndCount();
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

