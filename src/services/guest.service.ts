import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Guest } from '../entities/guest.entity';
import { GuestDto } from '../dtos/guest.dto';
import { PaginatedResponse, PaginationParams } from '../dtos/filter.dto';
import { getMessages, SupportedLocale } from '../constants/messages';
import { GuestSource } from '../enums/guest-source.enum';
import { RsvpStatus } from '../enums/rsvp-status.enum';
import { EventService } from './event.service';

@Injectable()
export class GuestService {
  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly eventService: EventService,
  ) {}

  private generateToken(): string {
    return randomBytes(24).toString('base64url');
  }

  async findPagination(
    eventId: number,
    userId: number,
    params: PaginationParams,
    locale: SupportedLocale = 'vi',
  ): Promise<PaginatedResponse<Guest>> {
    await this.eventService.findOneForUser(eventId, userId, locale);
    const { page = 1, size = 20, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.guestRepository.createQueryBuilder('guest').where('guest.eventId = :eventId', { eventId });
    if (search) {
      qb.andWhere('(guest.name LIKE :search OR guest.phone LIKE :search OR guest.email LIKE :search)', {
        search: `%${search}%`,
      });
    }
    const [data, total] = await qb.orderBy('guest.id', 'DESC').skip(skip).take(size).getManyAndCount();
    const withUrls = data.map((g) => ({
      ...g,
      invitationUrl: this.eventService.invitationUrl(g.publicToken),
    }));
    return { data: withUrls as any, total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findOneForUser(eventId: number, guestId: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Guest> {
    await this.eventService.findOneForUser(eventId, userId, locale);
    const guest = await this.guestRepository.findOne({ where: { id: guestId, eventId } });
    if (!guest) {
      throw new NotFoundException(getMessages(locale).eventlab.guestNotFound);
    }
    return guest;
  }

  async create(eventId: number, userId: number, dto: GuestDto, locale: SupportedLocale = 'vi'): Promise<Guest> {
    await this.eventService.findOneForUser(eventId, userId, locale);
    const guest = this.guestRepository.create({
      eventId,
      name: dto.name,
      phone: dto.phone,
      email: dto.email,
      group: dto.group,
      source: dto.source || GuestSource.MANUAL,
      extraData: dto.extraData || {},
      publicToken: this.generateToken(),
      rsvpStatus: RsvpStatus.PENDING,
      plusOnes: 0,
    });
    const saved = await this.guestRepository.save(guest);
    return { ...saved, invitationUrl: this.eventService.invitationUrl(saved.publicToken) } as any;
  }

  async update(
    eventId: number,
    guestId: number,
    userId: number,
    dto: Partial<GuestDto>,
    locale: SupportedLocale = 'vi',
  ): Promise<Guest> {
    const guest = await this.findOneForUser(eventId, guestId, userId, locale);
    if (dto.name !== undefined) guest.name = dto.name;
    if (dto.phone !== undefined) guest.phone = dto.phone;
    if (dto.email !== undefined) guest.email = dto.email;
    if (dto.group !== undefined) guest.group = dto.group;
    if (dto.extraData !== undefined) guest.extraData = dto.extraData;
    return this.guestRepository.save(guest);
  }

  async remove(eventId: number, guestId: number, userId: number, locale: SupportedLocale = 'vi') {
    const guest = await this.findOneForUser(eventId, guestId, userId, locale);
    await this.guestRepository.remove(guest);
    return { deleted: true };
  }

  async importMany(eventId: number, userId: number, guests: GuestDto[], source: GuestSource, locale: SupportedLocale = 'vi') {
    await this.eventService.findOneForUser(eventId, userId, locale);
    if (!guests?.length) {
      throw new BadRequestException(getMessages(locale).eventlab.importEmpty);
    }
    const entities = guests
      .filter((g) => g.name && String(g.name).trim())
      .map((dto) =>
        this.guestRepository.create({
          eventId,
          name: String(dto.name).trim(),
          phone: dto.phone ? String(dto.phone) : undefined,
          email: dto.email ? String(dto.email) : undefined,
          group: dto.group,
          source,
          extraData: dto.extraData || {},
          publicToken: this.generateToken(),
          rsvpStatus: RsvpStatus.PENDING,
          plusOnes: 0,
        }),
      );
    const saved = await this.guestRepository.save(entities);
    return { imported: saved.length, guests: saved };
  }

  async findByPublicToken(token: string, locale: SupportedLocale = 'vi'): Promise<Guest> {
    const guest = await this.guestRepository.findOne({
      where: { publicToken: token },
      relations: ['event', 'event.template'],
    });
    if (!guest) {
      throw new NotFoundException(getMessages(locale).eventlab.inviteNotFound);
    }
    return guest;
  }

  async markViewed(token: string, locale: SupportedLocale = 'vi'): Promise<Guest> {
    const guest = await this.findByPublicToken(token, locale);
    if (!guest.viewedAt) {
      guest.viewedAt = new Date();
      await this.guestRepository.save(guest);
    }
    return guest;
  }

  async rsvp(token: string, status: RsvpStatus, note: string | undefined, plusOnes: number | undefined, locale: SupportedLocale = 'vi') {
    const guest = await this.findByPublicToken(token, locale);
    guest.rsvpStatus = status;
    guest.rsvpNote = note;
    guest.plusOnes = plusOnes ?? guest.plusOnes ?? 0;
    guest.respondedAt = new Date();
    return this.guestRepository.save(guest);
  }
}
