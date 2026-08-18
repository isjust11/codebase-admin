import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Event } from '../entities/event.entity';
import { Template } from '../entities/template.entity';
import { Guest } from '../entities/guest.entity';
import { EventDto } from '../dtos/event.dto';
import { PaginatedResponse, PaginationParams } from '../dtos/filter.dto';
import { getMessages, SupportedLocale } from '../constants/messages';
import { EventStatus } from '../enums/event-status.enum';
import { TemplateType } from '../enums/template-type.enum';
import { RsvpStatus } from '../enums/rsvp-status.enum';
import { TemplateRenderService } from './template-render.service';

@Injectable()
export class EventService {
  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    private readonly templateRenderService: TemplateRenderService,
  ) {}

  private publicBaseUrl(): string {
    return (process.env.PUBLIC_INVITE_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3200').replace(/\/$/, '');
  }

  invitationUrl(token: string): string {
    return `${this.publicBaseUrl()}/e/${token}`;
  }

  async findPagination(userId: number, params: PaginationParams): Promise<PaginatedResponse<Event>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.template', 'template')
      .where('event.userId = :userId', { userId });
    if (search) {
      qb.andWhere('(event.title LIKE :search OR event.venue LIKE :search)', { search: `%${search}%` });
    }
    const [data, total] = await qb.orderBy('event.id', 'DESC').skip(skip).take(size).getManyAndCount();
    return { data, total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findOneForUser(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.eventRepository.findOne({
      where: { id },
      relations: ['template', 'user'],
    });
    if (!event) {
      throw new NotFoundException(getMessages(locale).eventlab.eventNotFound);
    }
    if (event.userId !== userId) {
      throw new ForbiddenException(getMessages(locale).eventlab.forbidden);
    }
    return event;
  }

  async create(userId: number, dto: EventDto): Promise<Event> {
    const entity = this.eventRepository.create({
      userId,
      title: dto.title,
      type: dto.type || TemplateType.EVENT,
      templateId: dto.templateId ? Number(dto.templateId) : undefined,
      eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
      venue: dto.venue,
      coverImageUrl: dto.coverImageUrl,
      eventData: dto.eventData || {},
      status: dto.status || EventStatus.DRAFT,
    });
    return this.eventRepository.save(entity);
  }

  async update(id: number, userId: number, dto: Partial<EventDto>, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    if (dto.title !== undefined) event.title = dto.title;
    if (dto.type !== undefined) event.type = dto.type;
    if (dto.eventDate !== undefined) event.eventDate = dto.eventDate ? new Date(dto.eventDate) : undefined;
    if (dto.venue !== undefined) event.venue = dto.venue;
    if (dto.coverImageUrl !== undefined) event.coverImageUrl = dto.coverImageUrl;
    if (dto.eventData !== undefined) event.eventData = dto.eventData;
    if (dto.status !== undefined) event.status = dto.status;
    if (dto.templateId !== undefined) event.templateId = dto.templateId ? Number(dto.templateId) : undefined;
    return this.eventRepository.save(event);
  }

  async assignTemplate(id: number, userId: number, templateId: number, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    const template = await this.templateRepository.findOne({ where: { id: templateId } });
    if (!template) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    event.templateId = template.id;
    event.type = template.type;
    return this.eventRepository.save(event);
  }

  async updateData(id: number, userId: number, eventData: Record<string, any>, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    event.eventData = { ...(event.eventData || {}), ...eventData };
    if (eventData.venue) event.venue = eventData.venue;
    if (eventData.eventDate) event.eventDate = new Date(eventData.eventDate);
    return this.eventRepository.save(event);
  }

  async publish(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    event.status = EventStatus.PUBLISHED;
    return this.eventRepository.save(event);
  }

  async remove(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<{ deleted: boolean }> {
    const event = await this.findOneForUser(id, userId, locale);
    await this.eventRepository.remove(event);
    return { deleted: true };
  }

  async preview(id: number, userId: number, guestId: number | undefined, locale: SupportedLocale = 'vi') {
    const event = await this.findOneForUser(id, userId, locale);
    if (!event.templateId) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    const template = await this.templateRepository.findOne({ where: { id: event.templateId } });
    if (!template) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    let guest: Guest | undefined;
    if (guestId) {
      guest = await this.guestRepository.findOne({ where: { id: guestId, eventId: event.id } }) || undefined;
    }
    const invitationUrl = guest ? this.invitationUrl(guest.publicToken) : this.invitationUrl('preview');
    const html = this.templateRenderService.mergeHtml(template.htmlContent, template.cssContent, {
      event: event as any,
      guest: guest as any,
      invitationUrl,
    });
    return { html, event, guest, invitationUrl };
  }

  async rsvpStats(id: number, userId: number, locale: SupportedLocale = 'vi') {
    await this.findOneForUser(id, userId, locale);
    const rows = await this.guestRepository
      .createQueryBuilder('guest')
      .select('guest.rsvpStatus', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('guest.eventId = :id', { id })
      .groupBy('guest.rsvpStatus')
      .getRawMany();
    const counts = {
      [RsvpStatus.PENDING]: 0,
      [RsvpStatus.ATTENDING]: 0,
      [RsvpStatus.DECLINED]: 0,
      [RsvpStatus.MAYBE]: 0,
      total: 0,
    };
    for (const row of rows) {
      const status = row.status as RsvpStatus;
      const count = Number(row.count) || 0;
      counts[status] = count;
      counts.total += count;
    }
    return counts;
  }
}
