/**
 * Contract aligned with templates/wedding-basic/slots.schema.json
 * Used for variablesSchema on the wedding-basic React template.
 */
export const WEDDING_BASIC_TEMPLATE_SLUG = 'wedding-basic';

export const WEDDING_BASIC_VARIABLES_SCHEMA = [
  { key: 'brideName', label: 'Tên cô dâu', type: 'text', scope: 'event', required: true },
  { key: 'groomName', label: 'Tên chú rể', type: 'text', scope: 'event', required: true },
  { key: 'eventDate', label: 'Ngày giờ (ISO)', type: 'date', scope: 'event', required: true },
  { key: 'eventDateDisplay', label: 'Ngày hiển thị', type: 'text', scope: 'event', required: true },
  { key: 'city', label: 'Thành phố', type: 'text', scope: 'event', required: true },
  { key: 'venue', label: 'Địa điểm', type: 'text', scope: 'event', required: true },
  { key: 'hosts', label: 'Chủ trì', type: 'text', scope: 'event' },
  { key: 'mapsUrl', label: 'Link bản đồ', type: 'url', scope: 'event' },
  { key: 'welcomeLines', label: 'Dòng chào mời (JSON array)', type: 'json', scope: 'event' },
  { key: 'welcomeHighlightLineIndex', label: 'Index dòng highlight', type: 'text', scope: 'event' },
  { key: 'scheduleIntro', label: 'Mở đầu lịch trình', type: 'text', scope: 'event' },
  { key: 'schedule', label: 'Lịch trình (JSON array)', type: 'json', scope: 'event' },
  { key: 'eventNote', label: 'Ghi chú', type: 'text', scope: 'event' },
  { key: 'footerMessage', label: 'Footer message', type: 'text', scope: 'event' },
  { key: 'footerCredit', label: 'Footer credit', type: 'text', scope: 'event' },
  { key: 'locale', label: 'Locale', type: 'text', scope: 'event' },
];

export const WEDDING_BASIC_HTML = `<!DOCTYPE html>
<html lang="vi">
<head><meta charset="utf-8"/><title>{{groomName}} & {{brideName}}</title></head>
<body style="font-family:Georgia,serif;max-width:480px;margin:40px auto;padding:24px;text-align:center;color:#333;">
  <p style="letter-spacing:.2em;text-transform:uppercase;font-size:12px;color:#888;">Wedding invite</p>
  <h1 style="font-weight:400;font-size:28px;margin:16px 0;">{{groomName}} &amp; {{brideName}}</h1>
  <p style="font-size:16px;">{{eventDateDisplay}}</p>
  <p style="margin-top:24px;">{{venue}}<br/><span style="color:#888;">{{city}}</span></p>
  <p style="margin-top:32px;font-size:13px;color:#666;">{{footerMessage}}</p>
  <p style="font-size:11px;color:#aaa;">{{footerCredit}}</p>
  <p style="margin-top:40px;font-size:11px;color:#bbb;">React host: templateId=wedding-basic · slots → eventData</p>
</body>
</html>`;

export const WEDDING_BASIC_CSS = `body{background:#faf8f5;}`;

/** Demo slot payloads (same as templates/wedding-invite/lib/template-data.ts). */
export const WEDDING_DEMO_EVENTS: Array<{
  slug: string;
  title: string;
  eventDate: string;
  venue: string;
  eventData: Record<string, any>;
}> = [
  {
    slug: 'minh-anh-hoang-nam',
    title: 'Minh Anh & Hoàng Nam',
    eventDate: '2026-10-18T17:30:00',
    venue: 'The Reverie Saigon',
    eventData: {
      brideName: 'Minh Anh',
      groomName: 'Hoàng Nam',
      eventDate: '2026-10-18T17:30:00',
      eventDateDisplay: '18 tháng 10, 2026',
      city: 'Thành phố Hồ Chí Minh',
      venue: 'The Reverie Saigon',
      hosts: 'Gia đình hai họ',
      mapsUrl: 'https://maps.google.com/?q=The+Reverie+Saigon',
      welcomeLines: [
        'Kính gửi quý khách,',
        'gia đình chúng tôi trân trọng kính mời',
        '',
        'Hoàng Nam & Minh Anh',
        '',
        'đến dự lễ thành hôn và chung vui',
        'trong ngày trọng đại của hai con.',
        'Sự hiện diện của quý khách',
        'là niềm vinh hạnh lớn lao đối với chúng tôi.',
      ],
      welcomeHighlightLineIndex: 3,
      scheduleIntro:
        'Chương trình ngày cưới diễn ra tại The Reverie Saigon. Mong quý khách sắp xếp đến đúng giờ.',
      schedule: [
        {
          time: '17:00',
          title: 'Đón khách',
          description: 'Welcome drink tại sảnh tầng 2.',
          image: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
          side: 'left',
        },
        {
          time: '17:30',
          title: 'Lễ thành hôn',
          description: 'Nghi thức trao lời thề và trao nhẫn.',
          image: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=800&q=80',
          side: 'right',
        },
        {
          time: '18:30',
          title: 'Tiệc cưới',
          description: 'Dùng tiệc và chung vui cùng hai họ.',
          image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
          side: 'left',
        },
      ],
      eventNote:
        'Toàn bộ sự kiện diễn ra tại một địa điểm. Có chỗ đậu xe. Mọi thắc mắc xin liên hệ gia đình.',
      footerMessage: 'Rất hân hạnh được đón tiếp quý khách!',
      footerCredit: 'Made with love • 2026',
      locale: 'vi-VN',
    },
  },
  {
    slug: 'aidana-dias',
    title: 'Aidana & Dias',
    eventDate: '2026-03-06T18:00:00',
    venue: 'Dariya ресторан',
    eventData: {
      brideName: 'Aidana',
      groomName: 'Dias',
      eventDate: '2026-03-06T18:00:00',
      eventDateDisplay: '6 наурыз 2026',
      city: 'Қызылорда қаласы',
      venue: 'Dariya ресторан',
      hosts: 'Бек & Жанар',
      mapsUrl: 'https://go.2gis.com/Cv0gu',
      welcomeLines: [
        'Құрметті қонақтар,',
        'сіздерді ұлымыз бен келініміз',
        '',
        'Диас & Айдананың',
        '',
        'Ақ отау тігіп, үлкен өмірге бірге',
        'қадам басатын қуанышты сәтіне',
        'және үйлену тойына арналған ақ дастарханымыздың',
        'қадірлі қонағы болуға сіздер шын жүректен шақырамыз!',
      ],
      welcomeHighlightLineIndex: 3,
      scheduleIntro:
        '6 наурыз күні не болатынын біліңіз. Барлық іс-шаралар Dariya ресторанында өтеді.',
      schedule: [
        {
          time: '16:30',
          title: 'Қонақтарды қарсы алу',
          description: 'Барлық қонақтарды Dariya ресторанына шақырамыз.',
          image: 'https://images.unsplash.com/photo-1529636798458-92182e662485?w=800&q=80',
          side: 'left',
        },
        {
          time: '17:00',
          title: 'Тойдың басталуы',
          description: 'Уақытында келуіңізді сұраймыз. Көріскенше!',
          image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80',
          side: 'right',
        },
      ],
      eventNote:
        'Барлық іс-шаралар бір орында өтеді. Паркингке орын бар. Қосымша сұрақтар туындаса, бізге хабарласыңыз.',
      footerMessage: 'Сіздерді тойымызда көруге асығамыз!',
      footerCredit: 'Махаббатпен жасалған • 2026',
      locale: 'kk-KZ',
    },
  },
];
