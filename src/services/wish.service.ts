import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Wish } from '../entities/wish.entity';
import { Event } from '../entities/event.entity';
import { Guest } from '../entities/guest.entity';
import { WishStatus } from '../enums/wish-status.enum';
import { getMessages, SupportedLocale } from '../constants/messages';

@Injectable()
export class WishService {
  constructor(
    @InjectRepository(Wish)
    private readonly wishRepository: Repository<Wish>,
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
  ) {}

  async listApprovedByToken(token: string, locale: SupportedLocale = 'vi') {
    const guest = await this.guestByToken(token, locale);
    return this.wishRepository.find({
      where: { eventId: guest.eventId, status: WishStatus.APPROVED },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async createByToken(token: string, body: { name?: string; message: string }, locale: SupportedLocale = 'vi') {
    const guest = await this.guestByToken(token, locale);
    const message = (body.message || '').trim();
    if (!message) {
      throw new BadRequestException(getMessages(locale).eventlab.wishEmpty);
    }
    const wish = this.wishRepository.create({
      eventId: guest.eventId,
      guestId: guest.id,
      name: (body.name || guest.name || 'Khách mời').trim(),
      message,
      status: WishStatus.PENDING,
    });
    return this.wishRepository.save(wish);
  }

  /** Approved wishes for the open invite link; only the fields a guest may see. */
  async listApprovedBySlug(slug: string, locale: SupportedLocale = 'vi') {
    const event = await this.eventBySlug(slug, locale);
    const wishes = await this.wishRepository.find({
      where: { eventId: event.id, status: WishStatus.APPROVED },
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return wishes.map((w) => ({ name: w.name, message: w.message, createdAt: w.createdAt }));
  }

  /** Wishes from the open link have no guest token, so they wait for the host's approval. */
  async createBySlug(slug: string, body: { name?: string; message: string }, locale: SupportedLocale = 'vi') {
    const event = await this.eventBySlug(slug, locale);
    const message = (body.message || '').trim().slice(0, 500);
    if (!message) {
      throw new BadRequestException(getMessages(locale).eventlab.wishEmpty);
    }
    const wish = this.wishRepository.create({
      eventId: event.id,
      name: (body.name || '').trim().slice(0, 80) || 'Khách mời',
      message,
      status: WishStatus.PENDING,
    });
    const saved = await this.wishRepository.save(wish);
    return { name: saved.name, message: saved.message, createdAt: saved.createdAt, status: saved.status };
  }

  async listForHost(eventId: number, userId: number, locale: SupportedLocale = 'vi') {
    await this.assertHost(eventId, userId, locale);
    return this.wishRepository.find({
      where: { eventId },
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async moderate(
    eventId: number,
    wishId: number,
    userId: number,
    status: WishStatus,
    locale: SupportedLocale = 'vi',
  ) {
    await this.assertHost(eventId, userId, locale);
    const wish = await this.wishRepository.findOne({ where: { id: wishId, eventId } });
    if (!wish) {
      throw new NotFoundException(getMessages(locale).eventlab.wishNotFound);
    }
    wish.status = status;
    return this.wishRepository.save(wish);
  }

  async remove(eventId: number, wishId: number, userId: number, locale: SupportedLocale = 'vi') {
    await this.assertHost(eventId, userId, locale);
    const wish = await this.wishRepository.findOne({ where: { id: wishId, eventId } });
    if (!wish) {
      throw new NotFoundException(getMessages(locale).eventlab.wishNotFound);
    }
    await this.wishRepository.remove(wish);
    return { deleted: true };
  }

  private async guestByToken(token: string, locale: SupportedLocale) {
    const guest = await this.guestRepository.findOne({
      where: { publicToken: token },
      relations: ['event'],
    });
    if (!guest) {
      throw new NotFoundException(getMessages(locale).eventlab.inviteNotFound);
    }
    return guest;
  }

  private async eventBySlug(slug: string, locale: SupportedLocale) {
    const event = await this.eventRepository.findOne({ where: { slug } });
    if (!event) {
      throw new NotFoundException(getMessages(locale).eventlab.inviteNotFound);
    }
    return event;
  }

  private async assertHost(eventId: number, userId: number, locale: SupportedLocale) {
    const event = await this.eventRepository.findOne({ where: { id: eventId } });
    if (!event) {
      throw new NotFoundException(getMessages(locale).eventlab.eventNotFound);
    }
    if (event.userId !== userId) {
      throw new ForbiddenException(getMessages(locale).eventlab.forbidden);
    }
    return event;
  }
}
