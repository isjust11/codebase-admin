import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { FilterType } from 'src/enums/filter-type.enum';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionTarget } from 'src/enums/interaction-target.enum';
import { FcmService } from './fcm.service';
import { FcmTokenService } from './fcm-token.service';
import { EbookTemplate } from 'src/templates/notification/ebook-template';
import { NotificationService } from './notification.service';
import { NotificationType } from 'src/enums/notification.enum';
import { Category } from 'src/entities/category.entity';
import { MediaService } from './media.service';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    private fcmService: FcmService,
    private fcmTokenService: FcmTokenService,
    private notificationService: NotificationService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private mediaService: MediaService,
  ) { }

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.find({ relations: ['category'] });
  }

  async getPublicBooks(filter: PaginationParams, filterType?: FilterType, categoryId?: number, userId?: number): Promise<PaginatedResponse<Book>> {
    const { page, size, search } = filter;
    const skip = ((page || 1) - 1) * (size || 10);
    const take = size;

    const query = this.bookRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .where('book.isPublic = :isPublic', { isPublic: true });

    // Apply filter types
    if (filterType) {
      // Join với interaction_stats để lấy favorite books
      if (filterType === FilterType.FAVORITE) {
        query.innerJoin(
          'interaction_stats',
          'stats',
          'stats.targetId = book.id AND stats.targetType = :targetType AND stats.favoriteStatus = true',
          { targetType: InteractionTarget.BOOK }
        );
      } else if (filterType === FilterType.ARCHIVED) {
        query.innerJoin(
          'interaction_stats',
          'stats',
          'stats.targetId = book.id AND stats.targetType = :targetType AND stats.archiveStatus = true',
          { targetType: InteractionTarget.BOOK }
        );
      }

      // uploaded books
      if (filterType === FilterType.UPLOADED) {
        query.andWhere('book.createById = :createById', { createById: userId });
      }
    }

    if (categoryId) {
      query.andWhere('book.categoryId = :categoryId', { categoryId });
    }

    if (search) {
      query.andWhere('(book.title LIKE :search OR book.author LIKE :search)', { search: `%${search}%` });
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
    const book = this.bookRepository.create({
      ...createBookDto,
      category: createBookDto.category ? { id: createBookDto.categoryId } : undefined,
    });
    const savedBook = await this.bookRepository.save(book);
    if (savedBook) {
      // Send FCM notification to topic
      // get user tokeninfor 
      const userTokens = await this.fcmTokenService.findByUserId(savedBook.createById);
      this.logger.log(`[createBook] userTokens: ${JSON.stringify(userTokens)}`);
      if (userTokens) {
        const ebookTemplate = EbookTemplate.newEbook(savedBook);
        const sendResult = await this.fcmService.sendToToken(userTokens.token, {
          title: ebookTemplate.title,
          body: ebookTemplate.body,
          type: 'ebook',
          data: ebookTemplate.data
        });
        this.logger.log(`[createBook] sendResult: ${sendResult}`);
        if (sendResult) {
          try {
          await this.notificationService.newNotification(
            NotificationType.EBOOK,
            ebookTemplate.data,
            ebookTemplate.title,
            ebookTemplate.body,
            userTokens.userId
          );
          } catch (error) {
            this.logger.error(`[NotificationService] error: ${error}`);
          }
          return savedBook;
        }
      }
    }
    return savedBook;
  }

  async updateBook(id: number, updateBookDto: UpdateBookDto): Promise<Book | null> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return null;
    }
    // update book
    Object.assign(book, updateBookDto);
    if (updateBookDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: updateBookDto.categoryId } });
      if (!category) {
        return null;
      }
      book.category = category;
      book.categoryId = category.id;
    }
    return this.bookRepository.save(book);
  }

  async deleteBook(id: number): Promise<boolean> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return false;
    }
    //delete file from storage
    const fileUrl = book.fileUrl.split('/').pop();
    if (fileUrl) {
      await this.mediaService.deleteFile(fileUrl, book.createById);
    }
    const coverImageUrl = book.coverImageUrl?.split('/').pop();
    if (coverImageUrl) {
      await this.mediaService.deleteFile(coverImageUrl, book.createById);
    }
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

