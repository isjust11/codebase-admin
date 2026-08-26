import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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
import { TemplateStatus } from '../enums/template-status.enum';
import { TemplateEditorMode } from '../enums/template-editor-mode.enum';
import { RsvpStatus } from '../enums/rsvp-status.enum';
import { TemplateRenderService } from './template-render.service';
import {
  WEDDING_BASIC_CSS,
  WEDDING_BASIC_HTML,
  WEDDING_BASIC_TEMPLATE_SLUG,
  WEDDING_BASIC_VARIABLES_SCHEMA,
  WEDDING_DEMO_EVENTS,
} from '../constants/wedding-basic-slots';
import {
  WEDDING_INVITE2_CSS,
  WEDDING_INVITE2_DEMO_EVENTS,
  WEDDING_INVITE2_HTML,
  WEDDING_INVITE2_TEMPLATE_SLUG,
  WEDDING_INVITE2_VARIABLES_SCHEMA,
} from '../constants/wedding-invite2-slots';

/** Public payload for React BaseTemplateHost (templates/wedding-invite). */
export type EventInvitePayload = {
  slug: string;
  templateId: string;
  title: string;
  data: Record<string, any>;
};

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
    return (process.env.PUBLIC_INVITE_BASE_URL || process.env.CLIENT_URL || 'http://localhost:3200').replace(
      /\/$/,
      '',
    );
  }

  invitationUrl(token: string): string {
    return `${this.publicBaseUrl()}/e/${token}`;
  }

  /** React invite host URL (wedding-invite /invite/:slug). */
  reactInviteUrl(slug: string): string {
    const base = (process.env.REACT_TEMPLATE_HOST_URL || 'http://localhost:3000').replace(/\/$/, '');
    return `${base}/invite/${slug}`;
  }

  private parseOptionalTemplateId(templateId: unknown): number | undefined {
    if (templateId === undefined || templateId === null || templateId === '') {
      return undefined;
    }
    const parsedId = Number(templateId);
    if (!Number.isFinite(parsedId) || parsedId <= 0) {
      throw new BadRequestException('templateId is invalid');
    }
    return parsedId;
  }

  private slugify(input: string): string {
    return input
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 200);
  }

  private async ensureUniqueSlug(base: string, excludeId?: number): Promise<string> {
    let slug = base || `event-${Date.now()}`;
    let n = 0;
    while (true) {
      const candidate = n === 0 ? slug : `${slug}-${n}`;
      const existing = await this.eventRepository.findOne({ where: { slug: candidate } });
      if (!existing || (excludeId && existing.id === excludeId)) {
        return candidate;
      }
      n += 1;
    }
  }

  toInvitePayload(event: Event): EventInvitePayload {
    if (!event.slug) {
      throw new BadRequestException('Event slug is required for public invite');
    }
    const templateSlug = event.template?.slug || WEDDING_BASIC_TEMPLATE_SLUG;
    return {
      slug: event.slug,
      templateId: templateSlug,
      title: event.title,
      data: event.eventData || {},
    };
  }

  async findPagination(userId: number, params: PaginationParams): Promise<PaginatedResponse<Event>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.template', 'template')
      .where('event.userId = :userId', { userId });
    if (search) {
      qb.andWhere('(event.title LIKE :search OR event.venue LIKE :search OR event.slug LIKE :search)', {
        search: `%${search}%`,
      });
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
    const baseSlug = dto.slug ? this.slugify(dto.slug) : this.slugify(dto.title);
    const slug = await this.ensureUniqueSlug(baseSlug);
    const entity = this.eventRepository.create({
      userId,
      title: dto.title,
      type: dto.type || TemplateType.EVENT,
      templateId: this.parseOptionalTemplateId(dto.templateId),
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
    if (dto.templateId !== undefined) event.templateId = this.parseOptionalTemplateId(dto.templateId);
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

  async updateData(
    id: number,
    userId: number,
    eventData: Record<string, any>,
    locale: SupportedLocale = 'vi',
  ): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    event.eventData = { ...(event.eventData || {}), ...eventData };
    if (eventData.venue) event.venue = eventData.venue;
    if (eventData.eventDate) event.eventDate = new Date(eventData.eventDate);
    return this.eventRepository.save(event);
  }

  async publish(id: number, userId: number, locale: SupportedLocale = 'vi'): Promise<Event> {
    const event = await this.findOneForUser(id, userId, locale);
    if (!event.slug) {
      event.slug = await this.ensureUniqueSlug(this.slugify(event.title), event.id);
    }
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
      guest = (await this.guestRepository.findOne({ where: { id: guestId, eventId: event.id } })) || undefined;
    }
    const invitationUrl = guest ? this.invitationUrl(guest.publicToken) : this.invitationUrl('preview');
    const html = this.templateRenderService.mergeHtml(template.htmlContent, template.cssContent, {
      event: event as any,
      guest: guest as any,
      invitationUrl,
    });
    const reactUrl = event.slug ? this.reactInviteUrl(event.slug) : undefined;
    return {
      html,
      event,
      guest,
      invitationUrl,
      reactInviteUrl: reactUrl,
      invitePayload: event.slug ? this.toInvitePayload({ ...event, template } as Event) : undefined,
    };
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
