import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

Handlebars.registerHelper('eq', (a, b) => a === b);

export interface MergeContext {
  event?: Record<string, any>;
  guest?: Record<string, any>;
  sample?: Record<string, any>;
  invitationUrl?: string;
  qrCodeUrl?: string;
}

@Injectable()
export class TemplateRenderService {
  mergeHtml(htmlContent: string, cssContent: string | undefined, context: MergeContext): string {
    const data = this.buildData(context);
    const compiled = Handlebars.compile(htmlContent || '', { noEscape: true });
    const body = compiled(data);
    return this.wrapDocument(body, cssContent);
  }

  private buildData(context: MergeContext): Record<string, any> {
    const event = context.event || {};
    const guest = context.guest || {};
    const eventData = (event.eventData as Record<string, any>) || {};
    const extraData = (guest.extraData as Record<string, any>) || {};
    const year = new Date().getFullYear();

    return {
      ...eventData,
      ...extraData,
      ...(context.sample || {}),
      eventTitle: event.title,
      eventDate: event.eventDate || eventData.eventDate,
      venue: event.venue || eventData.venue,
      coverImageUrl: event.coverImageUrl,
      guestName: guest.name || extraData.guestName || 'Quý khách',
      guestPhone: guest.phone,
      guestEmail: guest.email,
      tableNumber: extraData.tableNumber,
      personalMessage: extraData.personalMessage,
      invitationUrl: context.invitationUrl || '',
      eventUrl: context.invitationUrl || '',
      qrCodeUrl: context.qrCodeUrl || '',
      currentYear: year,
    };
  }

  private wrapDocument(body: string, cssContent?: string): string {
    const trimmed = (body || '').trim();
    if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
      if (cssContent) {
        return trimmed.replace('</head>', `<style>${cssContent}</style></head>`);
      }
      return trimmed;
    }
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    html, body { margin: 0; padding: 0; }
    ${cssContent || ''}
  </style>
</head>
<body>
${body}
</body>
</html>`;
  }
}
