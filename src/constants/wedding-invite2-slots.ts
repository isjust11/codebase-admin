/**
 * Contract aligned with templates/wedding-invite2/slots.schema.json
 */
export const WEDDING_INVITE2_TEMPLATE_SLUG = 'wedding-invite2';

export const WEDDING_INVITE2_VARIABLES_SCHEMA = [
  { key: 'brideName', label: 'Tên cô dâu', type: 'text', scope: 'event', required: true },
  { key: 'groomName', label: 'Tên chú rể', type: 'text', scope: 'event', required: true },
  { key: 'eventDate', label: 'Ngày giờ (ISO)', type: 'date', scope: 'event', required: true },
  { key: 'eventDateDisplay', label: 'Ngày hiển thị', type: 'text', scope: 'event', required: true },
  { key: 'city', label: 'Thành phố', type: 'text', scope: 'event', required: true },
  { key: 'venue', label: 'Địa điểm', type: 'text', scope: 'event', required: true },
  { key: 'hosts', label: 'Chủ trì', type: 'text', scope: 'event' },
  { key: 'mapsUrl', label: 'Link bản đồ', type: 'url', scope: 'event' },
  { key: 'quote', label: 'Câu quote', type: 'text', scope: 'event', required: true },
  { key: 'locale', label: 'Locale', type: 'text', scope: 'event' },
];

export const WEDDING_INVITE2_HTML = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"/><title>{{groomName}} & {{brideName}}</title></head>
<body style="font-family:Georgia,serif;max-width:480px;margin:40px auto;padding:24px;text-align:center;color:#654732;background:#faf8f3;">
  <p style="letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#e74c6b;">Wedding invite 2</p>
  <h1 style="font-weight:400;font-size:28px;margin:16px 0;">{{groomName}} &amp; {{brideName}}</h1>
  <p style="font-size:16px;">{{eventDateDisplay}}</p>
  <p style="margin-top:24px;">{{venue}}<br/><span style="color:#888;">{{city}}</span></p>
  <p style="margin-top:32px;font-size:15px;font-style:italic;color:#7d1f42;">“{{quote}}”</p>
  <p style="margin-top:40px;font-size:11px;color:#bbb;">React host: templateId=wedding-invite2 · slots → eventData</p>
</body>
</html>`;

export const WEDDING_INVITE2_CSS = `body{background:#faf8f3;}`;

export const WEDDING_INVITE2_DEMO_EVENTS: Array<{
  slug: string;
  title: string;
  eventDate: string;
  venue: string;
  eventData: Record<string, any>;
}> = [
  {
    slug: 'ngoc-anh-tuan',
    title: 'Ngọc Anh & Tuấn',
    eventDate: '2026-11-22T18:00:00',
    venue: 'JW Marriott Hanoi',
    eventData: {
      brideName: 'Ngọc Anh',
      groomName: 'Tuấn',
      eventDate: '2026-11-22T18:00:00',
      eventDateDisplay: '22 tháng 11, 2026',
      city: 'Hà Nội',
      venue: 'JW Marriott Hanoi',
      hosts: 'Gia đình hai họ',
      mapsUrl: 'https://maps.google.com/?q=JW+Marriott+Hanoi',
      quote: 'Có những người đến rồi đi, và có những người ở lại thành nhà.',
      locale: 'vi-VN',
    },
  },
];
