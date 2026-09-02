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
import { EventMedia, EventMediaType } from '../entities/event-media.entity';
import { EventDto, UpdateCustomizationDto, UpsertEventMediaDto } from '../dtos/event.dto';
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
    @InjectRepository(EventMedia)
    private readonly eventMediaRepository: Repository<EventMedia>,
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

  async getCustomization(
    id: number,
    userId: number,
    locale: SupportedLocale = 'vi',
    currentUser?: any,
  ) {
    const event = await this.findOneForUser(id, userId, locale);
    const template = event.templateId
      ? await this.templateRepository.findOne({ where: { id: event.templateId } })
      : null;

    let variablesSchema = template?.variablesSchema || [];
    if (!variablesSchema || variablesSchema.length === 0) {
      const templateSlug = template?.slug || WEDDING_BASIC_TEMPLATE_SLUG;
      if (templateSlug === WEDDING_INVITE2_TEMPLATE_SLUG) {
        variablesSchema = WEDDING_INVITE2_VARIABLES_SCHEMA;
      } else {
        variablesSchema = WEDDING_BASIC_VARIABLES_SCHEMA;
      }
    }

    const invitePayload = event.slug ? this.toInvitePayload({ ...event, template: template || undefined } as Event) : null;
    const reactInviteUrl = event.slug ? this.reactInviteUrl(event.slug) : null;

    // Check if user is restricted to VIEW_EDITOR role only
    const userRoleCodes: string[] = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r: any) => typeof r === 'string' ? r : r.code || r.name)
      : [];
    const isViewEditorOnly =
      userRoleCodes.includes('VIEW_EDITOR') &&
      !userRoleCodes.includes('TEMPLATE_MODIFY_EDITOR') &&
      !userRoleCodes.includes('ADMIN') &&
      !userRoleCodes.includes('SUPPER_ADMIN');

    const media = await this.getMedia(id, userId, locale);

    return {
      eventId: event.id,
      title: event.title,
      slug: event.slug,
      venue: event.venue,
      eventDate: event.eventDate,
      templateId: event.templateId,
      templateSlug: template?.slug || WEDDING_BASIC_TEMPLATE_SLUG,
      templateName: template?.name || 'Wedding Template',
      variablesSchema,
      eventData: event.eventData || {},
      media,
      invitePayload,
      reactInviteUrl,
      readOnly: isViewEditorOnly,
      userRoles: userRoleCodes,
    };
  }

  async updateCustomization(
    id: number,
    userId: number,
    dto: UpdateCustomizationDto,
    locale: SupportedLocale = 'vi',
    currentUser?: any,
  ) {
    // Verify user is not restricted by VIEW_EDITOR role
    const userRoleCodes: string[] = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r: any) => typeof r === 'string' ? r : r.code || r.name)
      : [];
    if (
      userRoleCodes.includes('VIEW_EDITOR') &&
      !userRoleCodes.includes('TEMPLATE_MODIFY_EDITOR') &&
      !userRoleCodes.includes('ADMIN') &&
      !userRoleCodes.includes('SUPPER_ADMIN')
    ) {
      throw new ForbiddenException('User with VIEW_EDITOR role cannot modify invitation content');
    }

    const event = await this.findOneForUser(id, userId, locale);

    if (dto.eventData) {
      event.eventData = { ...(event.eventData || {}), ...dto.eventData };
    }

    if (dto.title !== undefined) {
      event.title = dto.title;
    } else if (event.eventData?.brideName && event.eventData?.groomName) {
      event.title = `Lễ Thành Hôn · ${event.eventData.brideName} & ${event.eventData.groomName}`;
    }

    if (dto.venue !== undefined) {
      event.venue = dto.venue;
    } else if (event.eventData?.venue) {
      event.venue = event.eventData.venue;
    }

    if (dto.eventDate !== undefined) {
      event.eventDate = dto.eventDate ? new Date(dto.eventDate) : undefined;
    } else if (event.eventData?.eventDate) {
      event.eventDate = new Date(event.eventData.eventDate);
    }

    if (dto.slug !== undefined) {
      const baseSlug = this.slugify(dto.slug);
      event.slug = await this.ensureUniqueSlug(baseSlug, event.id);
    } else if (!event.slug) {
      event.slug = await this.ensureUniqueSlug(this.slugify(event.title), event.id);
    }

    const savedEvent = await this.eventRepository.save(event);
    const template = savedEvent.templateId
      ? await this.templateRepository.findOne({ where: { id: savedEvent.templateId } })
      : null;

    const invitePayload = savedEvent.slug
      ? this.toInvitePayload({ ...savedEvent, template: template || undefined } as Event)
      : null;

    return {
      event: savedEvent,
      invitePayload,
      reactInviteUrl: savedEvent.slug ? this.reactInviteUrl(savedEvent.slug) : null,
    };
  }

  // ---------------------------------------------------------------------------
  // Event Media Methods (Hybrid Storage)
  // ---------------------------------------------------------------------------

  /**
   * Returns all media items for an event, optionally filtered by groupKey.
   * Groups are returned as a map: { album: [...], highlight_video: [...] }
   */
  async getMedia(
    eventId: number,
    userId: number,
    locale: SupportedLocale = 'vi',
    groupKey?: string,
  ): Promise<Record<string, EventMedia[]>> {
    await this.findOneForUser(eventId, userId, locale); // ownership check

    const where: any = { eventId };
    if (groupKey) where.groupKey = groupKey;

    const items = await this.eventMediaRepository.find({
      where,
      order: { groupKey: 'ASC', sortOrder: 'ASC', id: 'ASC' },
    });

    // Group by groupKey
    return items.reduce<Record<string, EventMedia[]>>((acc, item) => {
      if (!acc[item.groupKey]) acc[item.groupKey] = [];
      acc[item.groupKey].push(item);
      return acc;
    }, {});
  }

  /**
   * Replaces all media items in a group with the new list (replace strategy).
   * Validates that the user has write access and is not VIEW_EDITOR only.
   */
  async upsertMedia(
    eventId: number,
    userId: number,
    dto: UpsertEventMediaDto,
    locale: SupportedLocale = 'vi',
    currentUser?: any,
  ): Promise<EventMedia[]> {
    // RBAC: VIEW_EDITOR cannot write media
    const userRoleCodes: string[] = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name))
      : [];
    if (
      userRoleCodes.includes('VIEW_EDITOR') &&
      !userRoleCodes.includes('TEMPLATE_MODIFY_EDITOR') &&
      !userRoleCodes.includes('ADMIN') &&
      !userRoleCodes.includes('SUPPER_ADMIN')
    ) {
      throw new ForbiddenException('User with VIEW_EDITOR role cannot modify event media');
    }

    await this.findOneForUser(eventId, userId, locale); // ownership check

    // Delete existing items in this group for this event
    await this.eventMediaRepository.delete({ eventId, groupKey: dto.groupKey });

    if (!dto.items || dto.items.length === 0) {
      return [];
    }

    // Build and save new items
    const entities = dto.items.map((item, index) =>
      this.eventMediaRepository.create({
        eventId,
        groupKey: dto.groupKey,
        type: item.type ?? EventMediaType.IMAGE,
        url: item.url,
        caption: item.caption,
        mimeType: item.mimeType,
        fileSize: item.fileSize,
        width: item.width,
        height: item.height,
        sortOrder: item.sortOrder ?? index,
      }),
    );

    return this.eventMediaRepository.save(entities);
  }

  /**
   * Deletes a single media item by id, verifying event ownership.
   */
  async deleteMediaItem(
    mediaId: number,
    eventId: number,
    userId: number,
    locale: SupportedLocale = 'vi',
    currentUser?: any,
  ): Promise<{ deleted: boolean }> {
    // RBAC check
    const userRoleCodes: string[] = Array.isArray(currentUser?.roles)
      ? currentUser.roles.map((r: any) => (typeof r === 'string' ? r : r.code || r.name))
      : [];
    if (
      userRoleCodes.includes('VIEW_EDITOR') &&
      !userRoleCodes.includes('TEMPLATE_MODIFY_EDITOR') &&
      !userRoleCodes.includes('ADMIN') &&
      !userRoleCodes.includes('SUPPER_ADMIN')
    ) {
      throw new ForbiddenException('User with VIEW_EDITOR role cannot delete event media');
    }

    await this.findOneForUser(eventId, userId, locale); // ownership check

    const media = await this.eventMediaRepository.findOne({
      where: { id: mediaId, eventId },
    });
    if (!media) {
      throw new NotFoundException('Media item not found');
    }

    await this.eventMediaRepository.remove(media);
    return { deleted: true };
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
    const reactUrl = event.slug ? this.reactInviteUrl(event.slug) : undefined;
    return {
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

  async seedWeddingDemo(userId: number) {
    let t1 = await this.templateRepository.findOne({ where: { slug: WEDDING_BASIC_TEMPLATE_SLUG } });
    if (!t1) {
      t1 = this.templateRepository.create({
        name: 'Wedding Basic (React)',
        slug: WEDDING_BASIC_TEMPLATE_SLUG,
        type: TemplateType.EVENT,
        variablesSchema: WEDDING_BASIC_VARIABLES_SCHEMA,
        status: TemplateStatus.PUBLISHED,
        isPublished: true,
        createdById: userId,
      });
      t1 = await this.templateRepository.save(t1);
    }

    let t2 = await this.templateRepository.findOne({ where: { slug: WEDDING_INVITE2_TEMPLATE_SLUG } });
    if (!t2) {
      t2 = this.templateRepository.create({
        name: 'Wedding Invite 2 (React)',
        slug: WEDDING_INVITE2_TEMPLATE_SLUG,
        type: TemplateType.EVENT,
        variablesSchema: WEDDING_INVITE2_VARIABLES_SCHEMA,
        status: TemplateStatus.PUBLISHED,
        isPublished: true,
        createdById: userId,
      });
      t2 = await this.templateRepository.save(t2);
    }

    const seededEvents: Event[] = [];

    for (const item of WEDDING_DEMO_EVENTS) {
      let event = await this.eventRepository.findOne({ where: { slug: item.slug } });
      if (!event) {
        event = this.eventRepository.create({
          userId,
          title: item.title,
          slug: item.slug,
          type: TemplateType.EVENT,
          templateId: t1.id,
          eventDate: item.eventDate ? new Date(item.eventDate) : undefined,
          venue: item.venue,
          eventData: item.eventData,
          status: EventStatus.PUBLISHED,
        });
        event = await this.eventRepository.save(event);
      }
      seededEvents.push(event);
    }

    for (const item of WEDDING_INVITE2_DEMO_EVENTS) {
      let event = await this.eventRepository.findOne({ where: { slug: item.slug } });
      if (!event) {
        event = this.eventRepository.create({
          userId,
          title: item.title,
          slug: item.slug,
          type: TemplateType.EVENT,
          templateId: t2.id,
          eventDate: item.eventDate ? new Date(item.eventDate) : undefined,
          venue: item.venue,
          eventData: item.eventData,
          status: EventStatus.PUBLISHED,
        });
        event = await this.eventRepository.save(event);
      }
      seededEvents.push(event);
    }

    return {
      message: 'Seeded wedding templates and demo events successfully',
      templates: [t1, t2],
      events: seededEvents,
    };
  }

  async findPublicBySlug(slug: string, _locale?: SupportedLocale): Promise<EventInvitePayload> {
    let event: Event | null = null;
    try {
      event = await this.eventRepository.findOne({
        where: { slug },
        relations: ['template'],
      });
    } catch (e) {
      event = null;
    }

    if (event) {
      return this.toInvitePayload(event);
    }

    const demo1 = WEDDING_DEMO_EVENTS.find((e) => e.slug === slug);
    if (demo1) {
      return {
        slug: demo1.slug,
        templateId: WEDDING_BASIC_TEMPLATE_SLUG,
        title: demo1.title,
        data: demo1.eventData,
      };
    }

    const demo2 = WEDDING_INVITE2_DEMO_EVENTS.find((e) => e.slug === slug);
    if (demo2) {
      return {
        slug: demo2.slug,
        templateId: WEDDING_INVITE2_TEMPLATE_SLUG,
        title: demo2.title,
        data: demo2.eventData,
      };
    }

    throw new NotFoundException(`Event "${slug}" not found`);
  }

  async listPublicPublished(): Promise<Array<{ slug: string; templateId: string; title: string }>> {
    let dbEvents: Event[] = [];
    try {
      dbEvents = await this.eventRepository.find({
        where: { status: EventStatus.PUBLISHED },
        relations: ['template'],
        take: 50,
      });
    } catch (e) {
      dbEvents = [];
    }

    const result: Array<{ slug: string; templateId: string; title: string }> = dbEvents
      .filter((e) => Boolean(e.slug))
      .map((e) => ({
        slug: e.slug!,
        templateId: e.template?.slug || WEDDING_BASIC_TEMPLATE_SLUG,
        title: e.title,
      }));

    for (const d of WEDDING_DEMO_EVENTS) {
      if (!result.some((r) => r.slug === d.slug)) {
        result.push({
          slug: d.slug,
          templateId: WEDDING_BASIC_TEMPLATE_SLUG,
          title: d.title,
        });
      }
    }

    for (const d of WEDDING_INVITE2_DEMO_EVENTS) {
      if (!result.some((r) => r.slug === d.slug)) {
        result.push({
          slug: d.slug,
          templateId: WEDDING_INVITE2_TEMPLATE_SLUG,
          title: d.title,
        });
      }
    }

    return result;
  }

  async findPublicList(): Promise<{ events: Array<{ slug: string; templateId: string; title: string }> }> {
    const events = await this.listPublicPublished();
    return { events };
  }
}
