import { Injectable } from '@nestjs/common';
import * as Handlebars from 'handlebars';

Handlebars.registerHelper('eq', (a, b) => a === b);
Handlebars.registerHelper('formatDate', (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('vi-VN');
});

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
    return this.wrapDocument(body, cssContent, data.invitationUrl, data.eventDate);
  }

  private buildData(context: MergeContext): Record<string, any> {
    const event = context.event || {};
    const guest = context.guest || {};
    const eventData = (event.eventData as Record<string, any>) || {};
    const extraData = (guest.extraData as Record<string, any>) || {};
    const sample = context.sample || {};
    const year = new Date().getFullYear();

    return {
      ...sample,
      ...eventData,
      ...extraData,
      eventTitle: event.title ?? eventData.eventTitle ?? sample.eventTitle,
      eventDate: event.eventDate ?? eventData.eventDate ?? sample.eventDate,
      venue: event.venue ?? eventData.venue ?? sample.venue,
      coverImageUrl: event.coverImageUrl ?? eventData.coverImageUrl ?? sample.coverImageUrl,
      guestName: guest.name ?? extraData.guestName ?? sample.guestName ?? 'Quý khách',
      guestPhone: guest.phone ?? extraData.guestPhone ?? sample.guestPhone,
      guestEmail: guest.email ?? extraData.guestEmail ?? sample.guestEmail,
      tableNumber: extraData.tableNumber ?? sample.tableNumber,
      personalMessage: extraData.personalMessage ?? sample.personalMessage,
      invitationUrl: context.invitationUrl || sample.invitationUrl || '',
      eventUrl: context.invitationUrl || sample.eventUrl || sample.invitationUrl || '',
      qrCodeUrl: context.qrCodeUrl || sample.qrCodeUrl || '',
      currentYear: year,
    };
  }

  private wrapDocument(body: string, cssContent?: string, invitationUrl?: string, eventDate?: string): string {
    const runtime = this.runtimeScript(invitationUrl, eventDate);
    const trimmed = (body || '').trim();
    if (trimmed.toLowerCase().startsWith('<!doctype') || trimmed.toLowerCase().startsWith('<html')) {
      let next = trimmed;
      if (cssContent) {
        next = next.includes('</head>')
          ? next.replace('</head>', `<style>${cssContent}</style></head>`)
          : `${next}<style>${cssContent}</style>`;
      }
      if (next.includes('</body>')) {
        return next.replace('</body>', `${runtime}</body>`);
      }
      return `${next}${runtime}`;
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
${runtime}
</body>
</html>`;
  }

  private runtimeScript(invitationUrl?: string, eventDate?: string): string {
    return `<div class="el-lightbox" id="el-lightbox"><img alt="" /></div>
<script>
(function(){
  var boxes = document.querySelectorAll('.el-countdown[data-event-date]');
  function tick(){
    boxes.forEach(function(box){
      var target = new Date(box.getAttribute('data-event-date') || '${eventDate || ''}').getTime();
      var diff = Math.max(0, target - Date.now());
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor(diff / 3600000) % 24;
      var mins = Math.floor(diff / 60000) % 60;
      var secs = Math.floor(diff / 1000) % 60;
      var map = { days: days, hours: hours, mins: mins, secs: secs };
      box.querySelectorAll('[data-unit]').forEach(function(el){
        el.textContent = map[el.getAttribute('data-unit')] || 0;
      });
    });
  }
  if (boxes.length) { tick(); setInterval(tick, 1000); }
  var lb = document.getElementById('el-lightbox');
  document.querySelectorAll('.el-gallery__item').forEach(function(btn){
    btn.addEventListener('click', function(){
      var img = lb.querySelector('img');
      img.src = btn.getAttribute('data-src');
      lb.classList.add('is-open');
    });
  });
  if (lb) lb.addEventListener('click', function(){ lb.classList.remove('is-open'); });
})();
</script>`;
  }
}
