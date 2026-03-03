import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
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
import { InteractionType } from 'src/enums/interaction-type.enum';
import { UserSubscriptionService } from './user-subscription.service';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';

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
    private userSubscriptionService: UserSubscriptionService,
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
      if (filterType === FilterType.FAVORITE
        || filterType === FilterType.ARCHIVED
      ) {
        query.innerJoin(
          'user_interaction',
          'interaction',
          'interaction.targetId = book.id AND interaction.targetType = :targetType AND interaction.interactionType = :interactionType AND interaction.userId = :userId',
          { targetType: InteractionTarget.BOOK, interactionType: filterType, userId: userId }
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

  private validateBookData(dto: CreateBookDto | UpdateBookDto, isCreate: boolean): void {
    if (isCreate) {
      const createDto = dto as CreateBookDto;
      if (!createDto.title?.trim()) {
        throw new BadRequestException('Tiêu đề sách không được để trống');
      }
      if (!createDto.author?.trim()) {
        throw new BadRequestException('Tác giả không được để trống');
      }
      if (!createDto.fileUrl?.trim()) {
        throw new BadRequestException('File sách không được để trống');
      }
    } else {
      const updateDto = dto as UpdateBookDto;
      if (updateDto.title !== undefined && !updateDto.title?.trim()) {
        throw new BadRequestException('Tiêu đề sách không được để trống');
      }
      if (updateDto.author !== undefined && !updateDto.author?.trim()) {
        throw new BadRequestException('Tác giả không được để trống');
      }
    }

    // if (dto.categoryId) {
    //   if (typeof dto.categoryId !== 'number' || dto.categoryId <= 0) {
    //     throw new BadRequestException('Danh mục không hợp lệ');
    //   }
    // }
  }

  private async resolveFileSize(dto: CreateBookDto | UpdateBookDto, userId: number): Promise<number> {
    if (dto.fileSize && dto.fileSize > 0) return dto.fileSize;

    const fileUrl = (dto as CreateBookDto).fileUrl ?? (dto as UpdateBookDto).fileUrl;
    if (!fileUrl) return 0;

    const filename = fileUrl.split('/').pop();
    if (!filename) return 0;

    try {
      const info = await this.mediaService.getUserSizeData(userId);
      return info?.totalSize ?? 0;
    } catch {
      this.logger.warn(`[resolveFileSize] Could not get file info for ${filename}`);
      return 0;
    }
  }

  private async checkSubscriptionStorage(userId: number, bytes: number): Promise<void> {
    if (bytes <= 0) return;
    const sub = await this.userSubscriptionService.getActiveSubscription(userId);
    if (!sub) {
      throw new ForbiddenException('Bạn chưa có gói đăng ký đang hoạt động. Vui lòng đăng ký gói để tải sách lên.');
    }
    const canStore = await this.userSubscriptionService.canUseStorage(userId, bytes);
    if (!canStore) {
      const limitBytes = Number(sub.plan?.storageLimitBytes ?? 0);
      const usedBytes = Number(sub.storageUsedBytes ?? 0);
      const limitMB = (limitBytes / (1024 * 1024)).toFixed(1);
      const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
      throw new ForbiddenException(
        `Dung lượng lưu trữ đã đầy (${usedMB}MB / ${limitMB}MB). Vui lòng nâng cấp gói.`,
      );
    }
  }

  private async trackStorageInteraction(
    userId: number,
    bookId: number,
    totalDataStorage: number,
  ): Promise<void> {
    try {
      let interaction = await this.userInteractionRepository.findOne({
        where: {
          userId,
          targetId: bookId,
          targetType: InteractionTarget.BOOK,
          interactionType: InteractionType.UPLOAD,
        },
      });
      if (interaction) {
        interaction.storageUsedBytes = totalDataStorage;
        interaction.updatedAt = new Date();
      } else {
        interaction = this.userInteractionRepository.create({
          userId,
          targetId: bookId,
          targetType: InteractionTarget.BOOK,
          interactionType: InteractionType.UPLOAD,
          bookId: bookId,
          storageUsedBytes: totalDataStorage,
          status: 1,
        });
      }
      await this.userInteractionRepository.save(interaction);

      await this.userSubscriptionService.incrementUsage(userId, {
        storageBytes: totalDataStorage,
      });
      this.logger.log(`[trackStorage] userId=${userId} bookId=${bookId} totalDataStorage=${totalDataStorage}`);
    } catch (err) {
      this.logger.warn(`[trackStorage] Failed: ${err?.message}`);
    }
  }

  async createBook(createBookDto: CreateBookDto): Promise<Book> {
    const userId = createBookDto.createById;

    this.validateBookData(createBookDto, true);

    if (createBookDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: createBookDto.categoryId } });
      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }
    }

    let totalDataStorage = 0;
  
    totalDataStorage = await this.resolveFileSize(createBookDto, userId!);
    
    await this.checkSubscriptionStorage(userId!, totalDataStorage);
    const bookStatus = await this.categoryRepository.findOne({ where: { code: CategoryCodeEnum.BOOK_STATUS_PENDING } });
    
    const book = this.bookRepository.create({
      ...createBookDto,
      statusId: bookStatus ? bookStatus.id : undefined,
      category: createBookDto.category ? { id: createBookDto.categoryId } : undefined,
    });
    const savedBook = await this.bookRepository.save(book);

    if (savedBook && totalDataStorage > 0) {
      await this.trackStorageInteraction(userId!, savedBook.id, totalDataStorage);
    }

    if (savedBook) {
      try {
        const userTokens = await this.fcmTokenService.findByUserId(savedBook.createById);
        if (userTokens) {
          const ebookTemplate = EbookTemplate.newEbook(savedBook);
          const sendResult = await this.fcmService.sendToToken(userTokens.token, {
            title: ebookTemplate.title,
            body: ebookTemplate.body,
            type: 'ebook',
            data: ebookTemplate.data,
          });
          if (sendResult) {
            await this.notificationService.newNotification(
              NotificationType.EBOOK,
              ebookTemplate.data,
              ebookTemplate.title,
              ebookTemplate.body,
              userTokens.userId,
            );
          }
        }
      } catch (error) {
        this.logger.error(`[createBook] Notification failed: ${error?.message}`);
      }
    }
    return savedBook;
  }

  async updateBook(id: number, updateBookDto: UpdateBookDto): Promise<Book | null> {
    const userId = updateBookDto.createById;
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return null;
    }

    this.validateBookData(updateBookDto, false);

    if (updateBookDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: updateBookDto.categoryId } });
      if (!category) {
        throw new BadRequestException('Danh mục không tồn tại');
      }
      book.category = category;
      book.categoryId = category.id;
    }

    const fileChanged = updateBookDto.fileUrl && updateBookDto.fileUrl !== book.fileUrl;
    let storageUsedBytes = 0;

    if (fileChanged) {
      storageUsedBytes = await this.resolveFileSize(updateBookDto, userId!);
    }
    if (updateBookDto.fileSize && updateBookDto.fileSize > 0) {
      storageUsedBytes = updateBookDto.fileSize;
    }

    Object.assign(book, updateBookDto);
   
    const savedBook = await this.bookRepository.save(book);

    if (fileChanged && storageUsedBytes > 0) {
      await this.trackStorageInteraction(userId!, savedBook.id, storageUsedBytes);
    }

    return savedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return false;
    }

    const fileUrl = book.fileUrl.split('/').pop();
    if (fileUrl) {
      await this.mediaService.deleteFile(fileUrl, book.createById);
    }
    const coverImageUrl = book.coverImageUrl?.split('/').pop();
    if (coverImageUrl) {
      await this.mediaService.deleteFile(coverImageUrl, book.createById);
    }

    if (book.fileSize > 0 && book.createById) {
      try {
        await this.userSubscriptionService.incrementUsage(book.createById, {
          storageBytes: -book.fileSize,
        });
        await this.userInteractionRepository.delete({
          userId: book.createById,
          targetId: id,
          targetType: InteractionTarget.BOOK,
          interactionType: InteractionType.UPLOAD,
        });
      } catch (err) {
        this.logger.warn(`[deleteBook] Storage rollback failed: ${err?.message}`);
      }
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

