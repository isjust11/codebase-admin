import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Contact } from '../entities/contact.entity';
import { ContactDto } from '../dtos/contact.dto';
import { PaginatedResponse, PaginationParams } from '../dtos/filter.dto';
import { getMessages, SupportedLocale } from '../constants/messages';

@Injectable()
export class ContactService {
  constructor(
    @InjectRepository(Contact)
    private readonly contactRepository: Repository<Contact>,
  ) {}

  async findPagination(userId: number, params: PaginationParams): Promise<PaginatedResponse<Contact>> {
    const { page = 1, size = 20, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.contactRepository.createQueryBuilder('contact').where('contact.userId = :userId', { userId });
    if (search) {
      qb.andWhere('(contact.name LIKE :search OR contact.phone LIKE :search OR contact.email LIKE :search)', {
        search: `%${search}%`,
      });
    }
    const [data, total] = await qb.orderBy('contact.id', 'DESC').skip(skip).take(size).getManyAndCount();
    return { data, total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Contact> {
    const contact = await this.contactRepository.findOne({ where: { id, userId } });
    if (!contact) {
      throw new NotFoundException(getMessages(locale).eventlab.contactNotFound);
    }
    return contact;
  }

  async create(userId: number, dto: ContactDto): Promise<Contact> {
    const entity = this.contactRepository.create({
      userId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      note: dto.note,
    });
    return this.contactRepository.save(entity);
  }

  async importMany(userId: number, contacts: ContactDto[], locale: SupportedLocale = 'vi') {
    if (!contacts?.length) {
      throw new BadRequestException(getMessages(locale).eventlab.importEmpty);
    }
    const entities = contacts
      .filter((c) => c.name && String(c.name).trim())
      .map((dto) =>
        this.contactRepository.create({
          userId,
          name: String(dto.name).trim(),
          phone: dto.phone,
          email: dto.email,
          note: dto.note,
        }),
      );
    const saved = await this.contactRepository.save(entities);
    return { imported: saved.length, contacts: saved };
  }

  async remove(id: number, userId: number, locale: SupportedLocale = 'vi') {
    const contact = await this.findOne(id, userId, locale);
    await this.contactRepository.remove(contact);
    return { deleted: true };
  }
}
