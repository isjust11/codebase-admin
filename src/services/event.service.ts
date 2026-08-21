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
      slug,
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
    if (dto.slug !== undefined) {
      const next = await this.ensureUniqueSlug(this.slugify(dto.slug || event.title), event.id);
      event.slug = next;
    }
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

  private async ensurePublishedReactTemplate(opts: {
    slug: string;
    name: string;
    description: string;
    htmlContent: string;
    cssContent: string;
    variablesSchema: Array<{ key: string; label: string; type: string; scope: string; required?: boolean }>;
    createdById?: number;
  }): Promise<Template> {
    let template = await this.templateRepository.findOne({ where: { slug: opts.slug } });
    if (template) {
      if (!template.isPublished || template.status !== TemplateStatus.PUBLISHED) {
        template.isPublished = true;
        template.status = TemplateStatus.PUBLISHED;
        template = await this.templateRepository.save(template);
      }
      return template;
    }
    template = this.templateRepository.create({
      name: opts.name,
      slug: opts.slug,
      type: TemplateType.WEDDING,
      description: opts.description,
      htmlContent: opts.htmlContent,
      cssContent: opts.cssContent,
      variablesSchema: opts.variablesSchema,
      editorMode: TemplateEditorMode.CODE,
      status: TemplateStatus.PUBLISHED,
      isPublished: true,
      createdById: opts.createdById,
    });
    return this.templateRepository.save(template);
  }

  /** Ensure wedding-basic template exists (published). */
  async ensureWeddingBasicTemplate(createdById?: number): Promise<Template> {
    return this.ensurePublishedReactTemplate({
      slug: WEDDING_BASIC_TEMPLATE_SLUG,
      name: 'Wedding Basic (React)',
      description:
        'Package templates/wedding-basic. Public JSON slots via GET /public/events/:slug',
      htmlContent: WEDDING_BASIC_HTML,
      cssContent: WEDDING_BASIC_CSS,
      variablesSchema: WEDDING_BASIC_VARIABLES_SCHEMA,
      createdById,
    });
  }

  async ensureWeddingInvite2Template(createdById?: number): Promise<Template> {
    return this.ensurePublishedReactTemplate({
      slug: WEDDING_INVITE2_TEMPLATE_SLUG,
      name: 'Wedding Invite 2 (React)',
      description:
        'Package templates/wedding-invite2. Public JSON slots via GET /public/events/:slug',
      htmlContent: WEDDING_INVITE2_HTML,
      cssContent: WEDDING_INVITE2_CSS,
      variablesSchema: WEDDING_INVITE2_VARIABLES_SCHEMA,
      createdById,
    });
  }

  private async upsertDemoEvents(
    userId: number,
    template: Template,
    demos: Array<{
      slug: string;
      title: string;
      eventDate: string;
      venue: string;
      eventData: Record<string, any>;
    }>,
  ): Promise<Event[]> {
    const created: Event[] = [];
    for (const demo of demos) {
      let event = await this.eventRepository.findOne({
        where: { slug: demo.slug },
        relations: ['template'],
      });
      if (event && event.userId !== userId) {
        throw new ConflictException(`Slug "${demo.slug}" already used by another user`);
      }
      if (!event) {
        event = this.eventRepository.create({
          userId,
          slug: demo.slug,
          title: demo.title,
          type: TemplateType.WEDDING,
          templateId: template.id,
          eventDate: new Date(demo.eventDate),
          venue: demo.venue,
          eventData: demo.eventData,
          status: EventStatus.PUBLISHED,
        });
      } else {
        event.title = demo.title;
        event.templateId = template.id;
        event.type = TemplateType.WEDDING;
        event.eventDate = new Date(demo.eventDate);
        event.venue = demo.venue;
        event.eventData = demo.eventData;
        event.status = EventStatus.PUBLISHED;
      }
      created.push(await this.eventRepository.save(event));
    }
    return created;
  }

  /**
   * Seed published React templates + demo events (idempotent per slug).
   * wedding-basic → minh-anh-hoang-nam, aidana-dias
   * wedding-invite2 → ngoc-anh-tuan
   */
  async seedWeddingDemo(userId: number) {
    const weddingBasic = await this.ensureWeddingBasicTemplate(userId);
    const weddingInvite2 = await this.ensureWeddingInvite2Template(userId);
    const created = [
      ...(await this.upsertDemoEvents(userId, weddingBasic, WEDDING_DEMO_EVENTS)),
      ...(await this.upsertDemoEvents(userId, weddingInvite2, WEDDING_INVITE2_DEMO_EVENTS)),
    ];
    const summarize = (template: Template) => ({
      id: template.id,
      slug: template.slug,
      name: template.name,
    });
    return {
      template: summarize(weddingBasic),
      templates: [summarize(weddingBasic), summarize(weddingInvite2)],
      events: created.map((e) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        status: e.status,
        reactInviteUrl: this.reactInviteUrl(e.slug!),
        publicApiUrl: `/public/events/${e.slug}`,
      })),
    };
  }

  async listPublicPublished(): Promise<Array<{ slug: string; templateId: string; title: string }>> {
    const events = await this.eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.template', 'template')
      .where('event.status = :status', { status: EventStatus.PUBLISHED })
      .andWhere('event.slug IS NOT NULL')
      .orderBy('event.id', 'DESC')
      .getMany();
    return events.map((e) => ({
      slug: e.slug!,
      templateId: e.template?.slug || WEDDING_BASIC_TEMPLATE_SLUG,
      title: e.title,
    }));
  }

  async findPublicBySlug(slug: string): Promise<EventInvitePayload> {
    const event = await this.eventRepository.findOne({
      where: { slug, status: EventStatus.PUBLISHED },
      relations: ['template'],
    });
    if (!event) {
      const available = await this.listPublicPublished();
      throw new NotFoundException({
        message: `Event "${slug}" not found`,
        available: available.map((e) => e.slug),
      });
    }
    return this.toInvitePayload(event);
  }
}
