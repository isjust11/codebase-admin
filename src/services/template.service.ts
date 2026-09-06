import { TemplateData } from '../entities/template-data.entity';
import { TemplateConfig } from '../entities/template-config.entity';
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Template } from '../entities/template.entity';
import { TemplateDto } from '../dtos/template.dto';
import { PaginatedResponse, PaginationParams } from '../dtos/filter.dto';
import { getMessages, SupportedLocale } from '../constants/messages';
import { TemplateRenderService } from './template-render.service';
import { TemplateSectionCompilerService } from './template-section-compiler.service';
import { TemplateType } from '../enums/template-type.enum';
import { TemplateStatus } from '../enums/template-status.enum';
import { TemplateEditorMode } from '../enums/template-editor-mode.enum';
import { RoleService } from './role.service';
import { RoleEnum } from '../enums/role.enum';
import { SECTION_CATALOG } from '../constants/wedding-layout';

type Actor = { id: number; roles?: any[]; isAdmin?: boolean };

@Injectable()
export class TemplateService {
  constructor(
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly templateRenderService: TemplateRenderService,
    private readonly templateSectionCompilerService: TemplateSectionCompilerService,
    private readonly roleService: RoleService,
  ) {}

  async canModerate(user?: Actor): Promise<boolean> {
    if (!user) return false;
    if (user.isAdmin) return true;
    const roleId = this.extractRoleId(user);
    if (!roleId) return false;
    const role = await this.roleService.findById(roleId);
    if (!role || role.isActive === false) return false;
    if (role.code === RoleEnum.SUPPER_ADMIN || role.code === RoleEnum.ADMIN) return true;
    return !!role.permissions?.some(
      (permission) =>
        permission.isActive &&
        (permission.code === 'TEMPLATE_PUBLISH' || permission.code === 'TEMPLATE_APPROVE'),
    );
  }

  async findPagination(
    params: PaginationParams & { status?: string },
    actor: Actor,
  ): Promise<PaginatedResponse<Template>> {
    const { page = 1, size = 10, search = '', status } = params;
    const skip = (page - 1) * size;
    const moderate = await this.canModerate(actor);
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .leftJoinAndSelect('template.category', 'category');
    if (search) {
      qb.andWhere('(template.name LIKE :search OR template.slug LIKE :search)', { search: `%${search}%` });
    }
    if (!moderate) {
      qb.andWhere('template.createdById = :userId', { userId: Number(actor.id) });
    }
    this.applyStatusFilter(qb, status);
    const [data, total] = await qb.orderBy('template.id', 'DESC').skip(skip).take(size).getManyAndCount();
    return { data: data.map((item) => this.normalize(item)), total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findMine(params: PaginationParams, userId: number): Promise<PaginatedResponse<Template>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .leftJoinAndSelect('template.createdBy', 'createdBy')
      .where('template.createdById = :userId', { userId: Number(userId) });
    if (search) {
      qb.andWhere('(template.name LIKE :search OR template.slug LIKE :search)', { search: `%${search}%` });
    }
    const [data, total] = await qb.orderBy('template.id', 'DESC').skip(skip).take(size).getManyAndCount();
    return { data: data.map((item) => this.normalize(item)), total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findCatalog(params: PaginationParams, type?: TemplateType): Promise<PaginatedResponse<Template>> {
    const { page = 1, size = 20, search = '' } = params;
    const skip = (page - 1) * size;
    const qb = this.templateRepository
      .createQueryBuilder('template')
      .where('template.isPublished = :published', { published: true });
    if (search) {
      qb.andWhere('(template.name LIKE :search OR template.slug LIKE :search)', { search: `%${search}%` });
    }
    if (type) {
      qb.andWhere('template.type = :type', { type });
    }
    const [data, total] = await qb.orderBy('template.id', 'DESC').skip(skip).take(size).getManyAndCount();
    return { data: data.map((item) => this.normalize(item)), total, page, size, totalPages: Math.ceil(total / size) };
  }

  async findOne(id: number, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.templateRepository.findOne({
      where: { id },
      relations: ['createdBy', 'category', 'data', 'data.config'],
    });
    if (!template) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    return this.normalize(template);
  }

  async create(dto: TemplateDto, actor: Actor): Promise<Template> {
    const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
    const moderate = await this.canModerate(actor);
    const published = moderate && dto.isPublished === true;
    const entity = this.templateRepository.create({
      name: dto.name,
      slug,
      type: dto.type || TemplateType.EVENT,
      thumbnailUrl: dto.thumbnailUrl,
      description: dto.description,
      variablesSchema: dto.variablesSchema || [],
      categoryId: dto.categoryId ? Number(dto.categoryId) : undefined,
      isPremium: dto.isPremium ?? false,
      createdById: dto.createdBy ? Number(dto.createdBy) : Number(actor.id),
      data: this.transformDtoData(dto.data),
    });
    this.applyStatus(entity, published ? TemplateStatus.PUBLISHED : TemplateStatus.DRAFT);
    return this.templateRepository.save(entity);
  }

  async update(id: number, dto: Partial<TemplateDto>, actor: Actor, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    const moderate = await this.canModerate(actor);
    this.assertCanEdit(template, actor, moderate, locale);
    if (dto.name) {
      template.name = dto.name;
      if (!dto.slug) {
        template.slug = slugify(dto.name, { lower: true, strict: true });
      }
    }
    if (dto.slug) template.slug = dto.slug;
    if (dto.type) template.type = dto.type;
    if (dto.thumbnailUrl !== undefined) template.thumbnailUrl = dto.thumbnailUrl;
    if (dto.description !== undefined) template.description = dto.description;
    if (dto.variablesSchema !== undefined) template.variablesSchema = dto.variablesSchema;
    if (dto.categoryId !== undefined) template.categoryId = dto.categoryId ? Number(dto.categoryId) : undefined;
    if (dto.isPremium !== undefined) template.isPremium = dto.isPremium;
    if (dto.data !== undefined) template.data = this.transformDtoData(dto.data);
    if (moderate && dto.isPublished !== undefined) {
      this.applyStatus(template, dto.isPublished ? TemplateStatus.PUBLISHED : TemplateStatus.DRAFT);
    }
    return this.templateRepository.save(template);
  }

  async submit(id: number, actor: Actor, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    const moderate = await this.canModerate(actor);
    if (!moderate && Number(template.createdById) !== Number(actor.id)) {
      throw new ForbiddenException(getMessages(locale).eventlab.templateForbidden);
    }
    const status = this.effectiveStatus(template);
    if (status !== TemplateStatus.DRAFT && status !== TemplateStatus.REJECTED) {
      throw new BadRequestException(getMessages(locale).eventlab.templateInvalidStatus);
    }
    this.applyStatus(template, TemplateStatus.PENDING);
    template.submittedAt = new Date();
    template.reviewNote = undefined;
    return this.templateRepository.save(template);
  }

  async approve(id: number, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    if (this.effectiveStatus(template) !== TemplateStatus.PENDING) {
      throw new BadRequestException(getMessages(locale).eventlab.templateInvalidStatus);
    }
    this.applyStatus(template, TemplateStatus.PUBLISHED);
    template.reviewNote = undefined;
    return this.templateRepository.save(template);
  }

  async reject(id: number, note: string | undefined, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    if (this.effectiveStatus(template) !== TemplateStatus.PENDING) {
      throw new BadRequestException(getMessages(locale).eventlab.templateInvalidStatus);
    }
    this.applyStatus(template, TemplateStatus.REJECTED);
    template.reviewNote = note || '';
    return this.templateRepository.save(template);
  }

  async publish(id: number, isPublished: boolean, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    this.applyStatus(template, isPublished ? TemplateStatus.PUBLISHED : TemplateStatus.DRAFT);
    return this.templateRepository.save(template);
  }

  async remove(id: number, actor: Actor, locale: SupportedLocale = 'vi'): Promise<{ deleted: boolean }> {
    const template = await this.findOne(id, locale);
    const moderate = await this.canModerate(actor);
    if (!moderate && Number(template.createdById) !== Number(actor.id)) {
      throw new ForbiddenException(getMessages(locale).eventlab.templateForbidden);
    }
    await this.templateRepository.remove(template);
    return { deleted: true };
  }

  private getReactInviteUrl(slug: string): string {
    const host = process.env.REACT_APP_URL || 'https://eventlab.app';
    return `${host}/invite/${slug}`;
  }

  catalogMeta() {
    return {
      sections: SECTION_CATALOG,
      starters: this.templateSectionCompilerService.starters(),
    };
  }

  async preview(id: number, sampleData: Record<string, any> = {}, locale: SupportedLocale = 'vi') {
    const template = await this.findOne(id, locale);
    return { 
      reactInviteUrl: template.slug ? this.getReactInviteUrl(template.slug) : undefined,
      template,
      sample: this.buildSampleData(template, sampleData)
    };
  }

  async publicPreview(id: number, locale: SupportedLocale = 'vi') {
    const template = await this.findOne(id, locale);
    if (!template.isPublished && this.effectiveStatus(template) !== TemplateStatus.PUBLISHED) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    return {
      reactInviteUrl: template.slug ? this.getReactInviteUrl(template.slug) : undefined,
      template: {
        id: template.id,
        name: template.name,
        slug: template.slug,
        type: template.type,
        description: template.description,
        thumbnailUrl: template.thumbnailUrl,
        status: TemplateStatus.PUBLISHED,
      },
    };
  }

  private buildSampleData(
    template: Pick<Template, 'name'> & { variablesSchema?: Template['variablesSchema'] },
    extra: Record<string, any> = {},
  ): Record<string, any> {
    const sample: Record<string, any> = {
      guestName: 'Nguyễn Văn A',
      brideName: 'Lan',
      groomName: 'Minh',
      eventTitle: template.name,
      eventDate: '2026-12-12',
      venue: 'Trung tâm hội nghị EventLab',
      familiesTitle: 'Hai bên gia đình',
      brideFather: 'Nguyễn Văn B',
      brideMother: 'Trần Thị C',
      groomFather: 'Lê Văn D',
      groomMother: 'Phạm Thị E',
      ceremonyTime: '09:00',
      ceremonyVenue: 'Nhà văn hoá phường',
      receptionTime: '18:00',
      receptionVenue: 'Trung tâm hội nghị EventLab',
      mapQuery: 'Ho Chi Minh City',
      coupleMessage: 'Cảm ơn vì đã đến chia vui cùng chúng mình.',
      dressCode: 'Formal / Pastel',
      galleryImages: [],
      storyItems: [
        { year: '2019', title: 'Gặp nhau', text: 'Một buổi cà phê tình cờ.' },
        { year: '2023', title: 'Cầu hôn', text: 'Lời hứa cho cả đời.' },
      ],
    };
    for (const variable of template.variablesSchema || []) {
      const key = variable?.key;
      if (!key) continue;
      if (variable.defaultValue !== undefined && variable.defaultValue !== null && variable.defaultValue !== '') {
        sample[key] = variable.defaultValue;
      }
    }
    return { ...sample, ...extra };
  }


  private applyStatus(template: Template, status: TemplateStatus) {
    template.status = status;
    template.isPublished = status === TemplateStatus.PUBLISHED;
  }

  private effectiveStatus(template: Template): TemplateStatus {
    if (template.isPublished) return TemplateStatus.PUBLISHED;
    return (template.status as TemplateStatus) || TemplateStatus.DRAFT;
  }

  private normalize(template: Template): Template {
    template.status = this.effectiveStatus(template);
    template.isPublished = template.status === TemplateStatus.PUBLISHED;
    if (template.data && Array.isArray(template.data)) {
      const mappedData: Record<string, any> = {};
      for (const item of template.data) {
        mappedData[item.fieldKey] = {
          type: item.fieldType,
          value: item.value,
          config: item.config ? {
            display: item.config.display,
            color: item.config.color,
            font: item.config.font,
            size: item.config.size
          } : undefined
        };
      }
      (template as any).data = mappedData;
    }
    return template;
  }

  private assertCanEdit(template: Template, actor: Actor, moderate: boolean, locale: SupportedLocale) {
    if (moderate) return;
    if (Number(template.createdById) !== Number(actor.id)) {
      throw new ForbiddenException(getMessages(locale).eventlab.templateForbidden);
    }
    if (this.effectiveStatus(template) === TemplateStatus.PUBLISHED) {
      throw new ForbiddenException(getMessages(locale).eventlab.templateNotEditable);
    }
  }

  private extractRoleId(user: Actor): number | null {
    if (!user.roles?.length) return null;
    const first = user.roles[0];
    return typeof first === 'number' ? first : first?.id || null;
  }

  private applyStatusFilter(qb: any, status?: string) {
    if (!status) return;
    if (status === TemplateStatus.PUBLISHED) {
      qb.andWhere('(template.isPublished = true OR template.status = :status)', { status });
      return;
    }
    qb.andWhere('template.status = :status', { status });
    if (status !== TemplateStatus.PUBLISHED) {
      qb.andWhere('template.isPublished = false');
    }
  }

  private transformDtoData(data?: Record<string, any>): TemplateData[] {
    if (!data) return [];
    const entities: TemplateData[] = [];
    for (const [key, field] of Object.entries(data)) {
      if (typeof field === 'object' && field.type) {
        const td = new TemplateData();
        td.fieldKey = key;
        td.fieldType = field.type;
        td.value = field.value || field.defaul;
        if (field.config) {
          const tc = new TemplateConfig();
          tc.display = field.config.display;
          tc.color = field.config.color;
          tc.font = field.config.font;
          tc.size = field.config.size;
          td.config = tc;
        }
        entities.push(td);
      }
    }
    return entities;
  }

  async importSchema(id: number, fileBuffer: Buffer, actor: any, locale: SupportedLocale = 'vi'): Promise<Template> {
    const template = await this.findOne(id, locale);
    const moderate = await this.canModerate(actor);
    this.assertCanEdit(template, actor, moderate, locale);

    let parsedData: any;
    try {
      const content = fileBuffer.toString('utf-8');
      parsedData = JSON.parse(content);
    } catch (e) {
      throw new BadRequestException('Invalid JSON file');
    }

    // Extract data node if they uploaded the full mockData.json, else assume it's directly the data object
    const schemaData = parsedData.data || parsedData;
    if (!schemaData || typeof schemaData !== 'object') {
      throw new BadRequestException('JSON must contain a "data" object');
    }

    // Delete existing template data to replace cleanly
    await this.templateRepository.manager.delete(TemplateData, { templateId: template.id });

    // Transform and assign
    const newTemplateData = this.transformDtoData(schemaData);
    template.data = newTemplateData;

    return this.templateRepository.save(template);
  }

}
