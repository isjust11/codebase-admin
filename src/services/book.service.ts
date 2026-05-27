import { Injectable, Logger, BadRequestException, ForbiddenException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BookFile, EbookFormat } from '../entities/book-file.entity';
import { User } from '../entities/user.entity';
import { CreateBookDto, UpdateBookDto } from 'src/dtos/book.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { FilterType } from 'src/enums/filter-type.enum';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionTarget } from 'src/enums/interaction-target.enum';
import { FcmService } from './fcm.service';
import { EbookTemplate } from 'src/templates/notification/ebook-template';
import { NotificationType } from 'src/enums/notification.enum';
import { Category } from 'src/entities/category.entity';
import { MediaService } from './media.service';
import { InteractionType } from 'src/enums/interaction-type.enum';
import { UserSubscriptionService } from './user-subscription.service';
import { CategoryCodeEnum } from 'src/enums/category-code.enum';
import { CategoryService } from './category.service';
import { BookFileService } from './book-file.service';
import { buildMatchKey } from 'src/utils/text-normalize.util';
import { detectEbookFormat } from 'src/utils/ebook-format.util';

@Injectable()
export class BookService {
  private readonly logger = new Logger(BookService.name);
  constructor(
    @InjectRepository(Book)
    private bookRepository: Repository<Book>,
    @InjectRepository(UserInteraction)
    private userInteractionRepository: Repository<UserInteraction>,
    private fcmService: FcmService,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    private mediaService: MediaService,
    private userSubscriptionService: UserSubscriptionService,
    private categoryService: CategoryService,
    private bookFileService: BookFileService,
  ) { }

  async getAllBooks(): Promise<Book[]> {
    return this.bookRepository.find({ relations: ['category', 'files'] });
  }

  async getPublicBooks(filter: PaginationParams,
    filterType?: FilterType,
    categoryId?: number,
    userId?: number,
    isSupperAdmin?: boolean,
    statusCode?: string,
    user?: User): Promise<PaginatedResponse<Book>> {
    const { page, size, search } = filter;
    const skip = ((page || 1) - 1) * (size || 10);
    const take = size;
    const query = this.bookRepository.createQueryBuilder('book')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.status', 'status')
      .leftJoinAndSelect('book.createBy', 'createBy')
      .leftJoinAndSelect('book.files', 'files');
    if (!isSupperAdmin) {
      query.where('book.isPublic = :isPublic', { isPublic: true });

      // Geographic filtering
      if (user) {
        if (user.countryCode) {
          query.andWhere('(book.countryCode IS NULL OR book.countryCode = :countryCode)', { countryCode: user.countryCode });
        }
        if (user.region) {
          query.andWhere('(book.region IS NULL OR book.region = :region)', { region: user.region });
        }
      }
    }
    // Filter by statusCode (admin filtering by moderation status)
    if (statusCode) {
      query.andWhere('status.code = :statusCode', { statusCode });
    }
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
      // Lấy toàn bộ id của nhánh: chính nó + con + cháu + chắt...
      // Đảm bảo filter "Lập trình" vẫn ra sách thuộc "Web > JavaScript > React".
      const branchIds = await this.categoryService.getDescendantIds(categoryId);
      if (branchIds.length > 0) {
        query.andWhere('book.categoryId IN (:...branchIds)', { branchIds });
      } else {
        // Không có nhánh nào → không trả book nào (tránh OR logic sai)
        query.andWhere('1 = 0');
      }
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
      relations: ['category', 'files'],
    });
  }

  private validateBookData(dto: CreateBookDto | UpdateBookDto, isCreate: boolean, locale: SupportedLocale = 'vi'): void {
    const m = getMessages(locale).book;
    if (isCreate) {
      const createDto = dto as CreateBookDto;
      if (!createDto.title?.trim()) {
        throw new BadRequestException(m.titleRequired);
      }
      if (!createDto.author?.trim()) {
        throw new BadRequestException(m.authorRequired);
      }
      if (!createDto.fileUrl?.trim()) {
        throw new BadRequestException(m.fileRequired);
      }
    } else {
      const updateDto = dto as UpdateBookDto;
      if (updateDto.title !== undefined && !updateDto.title?.trim()) {
        throw new BadRequestException(m.titleRequired);
      }
      if (updateDto.author !== undefined && !updateDto.author?.trim()) {
        throw new BadRequestException(m.authorRequired);
      }
    }

    // if (dto.categoryId) {
    //   if (typeof dto.categoryId !== 'number' || dto.categoryId <= 0) {
    //     throw new BadRequestException(m.categoryNotFound);
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

  private async checkSubscriptionStorage(userId: number, bytes: number, locale: SupportedLocale = 'vi'): Promise<void> {
    if (bytes <= 0) return;
    const m = getMessages(locale).subscription;
    const sub = await this.userSubscriptionService.getActiveSubscription(userId);
    if (!sub) {
      throw new ForbiddenException(m.noActiveSubscription);
    }
    const canStore = await this.userSubscriptionService.canUseStorage(userId, bytes);
    if (!canStore) {
      const limitBytes = Number(sub.plan?.storageLimitBytes ?? 0);
      const usedBytes = Number(sub.storageUsedBytes ?? 0);
      const limitMB = (limitBytes / (1024 * 1024)).toFixed(1);
      const usedMB = (usedBytes / (1024 * 1024)).toFixed(1);
      throw new ForbiddenException(m.storageFull(usedMB, limitMB));
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
      const storageData = await this.mediaService.getUserStorageUsedData(userId);
      await this.userSubscriptionService.incrementUsage(userId, {
        storageBytes: storageData?.usedSize || 0,
      });
      this.logger.log(`[trackStorage] userId=${userId} bookId=${bookId} totalDataStorage=${totalDataStorage}`);
    } catch (err) {
      this.logger.warn(`[trackStorage] Failed: ${err?.message}`);
    }
  }

  async createBook(createBookDto: CreateBookDto, locale: SupportedLocale = 'vi'): Promise<Book> {
    const userId = createBookDto.createById;

    this.validateBookData(createBookDto, true, locale);

    let parentCategoryId: number | null = null;
    if (createBookDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: createBookDto.categoryId } });
      if (!category) {
        throw new BadRequestException(getMessages(locale).book.categoryNotFound);
      }
      parentCategoryId = category.parentId ?? null;
    }

    let totalDataStorage = 0;

    totalDataStorage = await this.resolveFileSize(createBookDto, userId!);

    await this.checkSubscriptionStorage(userId!, totalDataStorage, locale);
    const bookStatus = await this.categoryRepository.findOne({ where: { code: CategoryCodeEnum.BOOK_STATUS_PENDING } });

    const book = this.bookRepository.create({
      ...createBookDto,
      statusId: bookStatus ? bookStatus.id : undefined,
      category: createBookDto.category ? { id: createBookDto.categoryId } : undefined,
      parentCategoryId: parentCategoryId ?? undefined,
      matchKey: buildMatchKey(createBookDto.title, createBookDto.author),
    });
    const savedBook = await this.bookRepository.save(book);

    if (savedBook && createBookDto.fileUrl) {
      try {
        const filename = createBookDto.fileUrl.split('/').pop() || createBookDto.title;
        const format = detectEbookFormat(filename, null);
        await this.bookFileService.createInitialFile(savedBook.id, {
          format,
          fileUrl: createBookDto.fileUrl,
          fileSize: totalDataStorage,
          totalPages: createBookDto.totalPages ?? null,
          source: 'upload',
        });
      } catch (err: any) {
        this.logger.warn(`[createBook] Failed to register BookFile: ${err?.message}`);
      }
    }

    if (savedBook && totalDataStorage > 0) {
      await this.trackStorageInteraction(userId!, savedBook.id, totalDataStorage);
    }

    if (savedBook) {
      try {
        const ebookTemplate = EbookTemplate.newEbook(savedBook);
        await this.fcmService.sendToUser(savedBook.createById, {
          title: ebookTemplate.title,
          body: ebookTemplate.body,
          type: NotificationType.EBOOK,
          data: ebookTemplate.data,
          bodyHtml: ebookTemplate.bodyHtml,
        });
      } catch (error) {
        this.logger.error(`[createBook] Notification failed: ${error?.message}`);
      }
    }
    return savedBook;
  }

  async updateBook(id: number, updateBookDto: UpdateBookDto, locale: SupportedLocale = 'vi'): Promise<Book | null> {
    const userId = updateBookDto.createById;
    const book = await this.bookRepository.findOne({ where: { id } });
    if (!book) {
      return null;
    }

    this.validateBookData(updateBookDto, false, locale);

    const fileChanged = updateBookDto.fileUrl && updateBookDto.fileUrl !== book.fileUrl;
    let storageUsedBytes = 0;

    if (fileChanged) {
      storageUsedBytes = await this.resolveFileSize(updateBookDto, userId!);
    }
    if (updateBookDto.fileSize && updateBookDto.fileSize > 0) {
      storageUsedBytes = updateBookDto.fileSize;
    }

    Object.assign(book, updateBookDto);
    if (updateBookDto.title !== undefined || updateBookDto.author !== undefined) {
      book.matchKey = buildMatchKey(book.title, book.author);
    }
    if (updateBookDto.categoryId) {
      const category = await this.categoryRepository.findOne({ where: { id: updateBookDto.categoryId } });
      if (!category) {
        throw new BadRequestException(getMessages(locale).book.categoryNotFound);
      }
      book.category = category;
      book.categoryId = category.id;
      // Đồng bộ parent_category_id (denormalized) để filter sách theo nhóm danh mục cha.
      book.parentCategoryId = category.parentId ?? null as any;
    }
    const savedBook = await this.bookRepository.save(book);

    if (fileChanged && storageUsedBytes > 0) {
      await this.trackStorageInteraction(userId!, savedBook.id, storageUsedBytes);
    }

    return savedBook;
  }

  async deleteBook(id: number): Promise<boolean> {
    const book = await this.bookRepository.findOne({
      where: { id },
      relations: ['files'],
    });
    if (!book) {
      return false;
    }

    // Xóa toàn bộ file vật lý ở tất cả định dạng (book_files sẽ tự CASCADE)
    const filesToDelete: string[] = [];
    if (book.files?.length) {
      for (const f of book.files) {
        const name = f.fileUrl?.split('/').pop();
        if (name) filesToDelete.push(name);
      }
    } else if (book.fileUrl) {
      const name = book.fileUrl.split('/').pop();
      if (name) filesToDelete.push(name);
    }
    for (const fileUrl of filesToDelete) {
      try {
        await this.mediaService.deleteFile(fileUrl, book.createById);
      } catch (err: any) {
        this.logger.warn(`[deleteBook] Delete file failed: ${err?.message}`);
      }
    }
    const coverImageUrl = book.coverImageUrl?.split('/').pop();
    if (coverImageUrl) {
      await this.mediaService.deleteFile(coverImageUrl, book.createById);
    }

    if (book.fileSize > 0 && book.createById) {
      try {
        const usedSize = await this.mediaService.getUserStorageUsedData(book.createById);

        await this.userSubscriptionService.incrementUsage(book.createById, {
          storageBytes: (usedSize?.usedSize || 0),
        });
      } catch (err) {
        this.logger.warn(`[deleteBook] Storage rollback failed: ${err?.message}`);
      }
    }

    const result = await this.bookRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async getStatistics(): Promise<any> {
    const total = await this.bookRepository.count();

    // Count by status
    const statusCounts = await this.bookRepository.createQueryBuilder('book')
      .leftJoin('book.status', 'status')
      .select('status.code', 'code')
      .addSelect('COUNT(*)', 'count')
      .groupBy('status.code')
      .getRawMany();

    const stats = {
      total,
      pending: 0,
      approved: 0,
      rejected: 0,
    };

    statusCounts.forEach(sc => {
      if (sc.code === CategoryCodeEnum.BOOK_STATUS_PENDING) stats.pending = parseInt(sc.count);
      if (sc.code === CategoryCodeEnum.BOOK_STATUS_APPROVED) stats.approved = parseInt(sc.count);
      if (sc.code === CategoryCodeEnum.BOOK_STATUS_REJECTED) stats.rejected = parseInt(sc.count);
    });

    return stats;
  }

  async updateStatus(id: number, statusCode: CategoryCodeEnum, locale: SupportedLocale = 'vi'): Promise<Book> {
    const book = await this.bookRepository.findOne({ where: { id } });
    const m = getMessages(locale).book;
    if (!book) {
      throw new BadRequestException(m.bookNotFound);
    }

    const status = await this.categoryRepository.findOne({ where: { code: statusCode } });
    if (!status) {
      throw new BadRequestException(m.statusInvalid);
    }

    book.statusId = status.id;
    book.status = status;

    // Nếu là approved thì mặc định cho phép public
    if (statusCode === CategoryCodeEnum.BOOK_STATUS_APPROVED) {
      book.isPublic = true;
    }

    return this.bookRepository.save(book);
  }

  async bulkDeleteBooks(
    ids: number[],
  ): Promise<{ success: number; failed: number; total: number }> {
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        const deleted = await this.deleteBook(id);
        if (deleted) success++;
        else failed++;
      } catch (err) {
        this.logger.warn(`[bulkDeleteBooks] id=${id}: ${err?.message}`);
        failed++;
      }
    }
    return { success, failed, total: ids.length };
  }

  async bulkUpdateStatus(
    ids: number[],
    statusCode: CategoryCodeEnum,
    locale: SupportedLocale = 'vi',
  ): Promise<{ success: number; failed: number; total: number }> {
    let success = 0;
    let failed = 0;
    for (const id of ids) {
      try {
        await this.updateStatus(id, statusCode, locale);
        success++;
      } catch (err) {
        this.logger.warn(`[bulkUpdateStatus] id=${id}: ${err?.message}`);
        failed++;
      }
    }
    return { success, failed, total: ids.length };
  }

  async searchBooks(keyword: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: [
        { title: Like(`%${keyword}%`), isPublic: true },
        { author: Like(`%${keyword}%`), isPublic: true },
        { createBy: { username: Like(`%${keyword}%`) } },
      ],
      relations: ['category', 'files'],
    });
  }

  async searchByTitle(title: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { title: Like(`%${title}%`), isPublic: true },
      relations: ['category', 'files'],
    });
  }

  async searchByAuthor(author: string): Promise<Book[]> {
    return this.bookRepository.find({
      where: { author: Like(`%${author}%`), isPublic: true },
      relations: ['category', 'files'],
    });
  }

  async getBooksByCategory(categoryId: number): Promise<Book[]> {
    return this.bookRepository.find({
      where: { categoryId },
      relations: ['category', 'files'],
    });
  }

  /**
   * Lấy chi tiết tất cả file định dạng của 1 book (cho endpoint mobile chọn format).
   */
  async getFilesOfBook(bookId: number): Promise<BookFile[]> {
    return this.bookFileService.listByBook(bookId);
  }

  /**
   * Bổ sung thêm 1 định dạng mới cho book đã có (vd: thêm bản EPUB cho 1 cuốn đang là PDF).
   */
  async addFormat(
    bookId: number,
    params: { fileUrl: string; fileSize?: number; totalPages?: number; format?: string },
    locale: SupportedLocale = 'vi',
  ): Promise<BookFile> {
    const book = await this.bookRepository.findOne({ where: { id: bookId } });
    if (!book) throw new BadRequestException(getMessages(locale).book.bookNotFound);

    const filename = params.fileUrl.split('/').pop() || book.title;
    const format = (params.format as EbookFormat) || detectEbookFormat(filename, null);

    const saved = await this.bookFileService.upsertFile({
      bookId,
      format,
      fileUrl: params.fileUrl,
      fileSize: params.fileSize ?? 0,
      totalPages: params.totalPages ?? null,
      source: 'upload',
    });
    await this.bookFileService.refreshPrimary(bookId);
    return saved;
  }
}

