import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as htmlPdf from 'html-pdf-node';
import { Guest } from '../entities/guest.entity';
import { Template } from '../entities/template.entity';
import { EventService } from './event.service';
import { GuestService } from './guest.service';
import { TemplateRenderService } from './template-render.service';
import { MediaService } from './media.service';
import { getMessages, SupportedLocale } from '../constants/messages';

@Injectable()
export class InvitationRenderService {
  private readonly logger = new Logger(InvitationRenderService.name);

  constructor(
    @InjectRepository(Guest)
    private readonly guestRepository: Repository<Guest>,
    @InjectRepository(Template)
    private readonly templateRepository: Repository<Template>,
    private readonly eventService: EventService,
    private readonly guestService: GuestService,
    private readonly templateRenderService: TemplateRenderService,
    private readonly mediaService: MediaService,
  ) {}

  async renderGuestImage(eventId: number, guestId: number, userId: number, locale: SupportedLocale = 'vi') {
    const event = await this.eventService.findOneForUser(eventId, userId, locale);
    const guest = await this.guestService.findOneForUser(eventId, guestId, userId, locale);
    if (!event.templateId) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    const template = await this.templateRepository.findOne({ where: { id: event.templateId } });
    if (!template) {
      throw new NotFoundException(getMessages(locale).eventlab.templateNotFound);
    }
    const invitationUrl = this.eventService.invitationUrl(guest.publicToken);
    const html = this.templateRenderService.mergeHtml(template.htmlContent, template.cssContent, {
      event: event as any,
      guest: guest as any,
      invitationUrl,
    });
    const buffer = await this.htmlToPng(html);
    const media = await this.mediaService.uploadFromBuffer(
      buffer,
      `eventlab-${eventId}-${guestId}.png`,
      'image/png',
      'eventlab-cards',
      userId,
    );
    guest.renderedImageUrl = media.url || media.publicRelativePath;
    guest.sentAt = guest.sentAt || new Date();
    await this.guestRepository.save(guest);
    return {
      url: guest.renderedImageUrl,
      invitationUrl,
      guest,
    };
  }

  private async htmlToPng(html: string): Promise<Buffer> {
    try {
      const puppeteer = require('puppeteer');
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      });
      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1080, height: 1920, deviceScaleFactor: 2 });
        await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
        const element =
          (await page.$('.el-cover')) || (await page.$('.el-invite-root')) || (await page.$('.card')) || (await page.$('body'));
        const buffer = await element.screenshot({ type: 'png' });
        return Buffer.from(buffer);
      } finally {
        await browser.close();
      }
    } catch (error: any) {
      this.logger.warn(`Puppeteer screenshot failed, falling back to PDF raster: ${error?.message}`);
      return this.pdfFallback(html);
    }
  }

  private async pdfFallback(html: string): Promise<Buffer> {
    const pdfBuffer = await htmlPdf.generatePdf(
      { content: html },
      { format: 'A5', printBackground: true, preferCSSPageSize: true },
    );
    return Buffer.from(pdfBuffer);
  }
}
