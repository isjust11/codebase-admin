import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { InviteEffectDto } from 'src/dtos/invite-effect.dto';
import { InviteEffect, InviteEffectKind } from 'src/entities/invite-effect.entity';

const KINDS: InviteEffectKind[] = ['burst', 'ambient', 'gate', 'scroll', 'audio'];

const DEFAULT_EFFECTS: InviteEffectDto[] = [
  {
    slug: 'confetti',
    themeKey: 'effectConfetti',
    name: 'Confetti',
    description: 'Bùng hoa giấy khi khách mở thiệp.',
    kind: 'burst',
    defaultEnabled: true,
    sortOrder: 1,
  },
  {
    slug: 'petals',
    themeKey: 'effectPetals',
    name: 'Cánh hoa',
    description: 'Cánh hoa bay trên ảnh bìa.',
    kind: 'ambient',
    defaultEnabled: true,
    sortOrder: 2,
  },
  {
    slug: 'envelope',
    themeKey: 'effectEnvelope',
    name: 'Phong bì',
    description: 'Màn mở phong bì trước khi vào nội dung thiệp.',
    kind: 'gate',
    defaultEnabled: true,
    sortOrder: 3,
  },
  {
    slug: 'auto-scroll',
    themeKey: 'autoScroll',
    name: 'Tự cuộn',
    description: 'Trang tự trượt xuống sau khi mở thiệp.',
    kind: 'scroll',
    defaultEnabled: false,
    sortOrder: 4,
    options: { autoScrollSpeed: ['slow', 'normal', 'fast'] },
  },
  {
    slug: 'music',
    themeKey: 'musicEnabled',
    name: 'Nhạc nền',
    description: 'Phát nhạc khi khách mở thiệp.',
    kind: 'audio',
    defaultEnabled: true,
    sortOrder: 5,
  },
];

@Injectable()
export class InviteEffectService implements OnModuleInit {
  private readonly logger = new Logger(InviteEffectService.name);

  constructor(
    @InjectRepository(InviteEffect)
    private readonly effects: Repository<InviteEffect>,
  ) {}

  async onModuleInit() {
    try {
      for (const item of DEFAULT_EFFECTS) {
        const existing = await this.effects.findOne({ where: { slug: item.slug } });
        if (!existing) {
          await this.effects.save(this.effects.create(item));
        }
      }
    } catch (error) {
      this.logger.warn(`Không nạp được kho hiệu ứng: ${error instanceof Error ? error.message : error}`);
    }
  }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<InviteEffect>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;
    const query = this.effects.createQueryBuilder('effect');
    if (search) {
      query.where('effect.name LIKE :search OR effect.slug LIKE :search OR effect.themeKey LIKE :search', {
        search: `%${search}%`,
      });
    }
    const [data, total] = await query
      .skip(skip)
      .take(size)
      .orderBy('effect.sortOrder', 'ASC')
      .addOrderBy('effect.id', 'ASC')
      .getManyAndCount();
    return { data, total, page, size, totalPages: Math.ceil(total / size) };
  }

  findActive(): Promise<InviteEffect[]> {
    return this.effects.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });
  }

  async findOne(id: number): Promise<InviteEffect> {
    const effect = await this.effects.findOne({ where: { id } });
    if (!effect) throw new NotFoundException('Không tìm thấy hiệu ứng');
    return effect;
  }

  async create(dto: InviteEffectDto): Promise<InviteEffect> {
    const payload = this.normalize(dto);
    const existing = await this.effects.findOne({ where: { slug: payload.slug } });
    if (existing) throw new BadRequestException('Slug hiệu ứng đã tồn tại');
    return this.effects.save(this.effects.create(payload));
  }

  async update(id: number, dto: InviteEffectDto): Promise<InviteEffect> {
    const current = await this.findOne(id);
    const payload = this.normalize({ ...current, ...dto, slug: dto.slug || current.slug });
    if (payload.slug !== current.slug) {
      const existing = await this.effects.findOne({ where: { slug: payload.slug } });
      if (existing) throw new BadRequestException('Slug hiệu ứng đã tồn tại');
    }
    await this.effects.save({ ...current, ...payload, id });
    return this.findOne(id);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.effects.delete(id);
    return { success: true };
  }

  private normalize(dto: InviteEffectDto) {
    const slug = String(dto.slug || '')
      .trim()
      .toLowerCase();
    const themeKey = String(dto.themeKey || '').trim();
    const name = String(dto.name || '').trim();
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
      throw new BadRequestException('Slug chỉ gồm chữ thường, số và dấu gạch ngang');
    }
    if (!themeKey || !name) {
      throw new BadRequestException('Tên và theme key là bắt buộc');
    }
    const kind = KINDS.includes(dto.kind as InviteEffectKind) ? (dto.kind as InviteEffectKind) : 'ambient';
    return {
      slug,
      themeKey,
      name,
      description: dto.description?.trim() || '',
      kind,
      defaultEnabled: dto.defaultEnabled !== false,
      options: dto.options ?? null,
      isActive: dto.isActive !== false,
      sortOrder: Number.isFinite(Number(dto.sortOrder)) ? Number(dto.sortOrder) : 0,
    };
  }
}
