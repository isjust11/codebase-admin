import { Injectable } from '@nestjs/common';
import {
  DEFAULT_THEME,
  LayoutJson,
  defaultWeddingLayout,
  ensureSectionIds,
} from '../constants/wedding-layout';
import { BASE_SECTION_CSS, SECTION_HTML } from '../constants/wedding-section-markup';
import { TemplateSectionType } from '../enums/template-section-type.enum';

export type CompiledTemplate = {
  html: string;
  css: string;
  variablesSchema: Array<{
    key: string;
    label: string;
    type: string;
    scope: 'event' | 'guest' | 'system';
    required?: boolean;
    defaultValue?: any;
  }>;
  layoutJson: LayoutJson;
};

const VARIABLE_CATALOG: CompiledTemplate['variablesSchema'] = [
  { key: 'eventTitle', label: 'Tên sự kiện', type: 'text', scope: 'event', required: true },
  { key: 'brideName', label: 'Tên cô dâu', type: 'text', scope: 'event', required: true, defaultValue: 'Lan' },
  { key: 'groomName', label: 'Tên chú rể', type: 'text', scope: 'event', required: true, defaultValue: 'Minh' },
  { key: 'eventDate', label: 'Ngày sự kiện', type: 'date', scope: 'event', required: true, defaultValue: '2026-12-12' },
  { key: 'coverImageUrl', label: 'Ảnh bìa', type: 'image', scope: 'event' },
  { key: 'guestName', label: 'Tên khách', type: 'text', scope: 'guest', required: true, defaultValue: 'Quý khách' },
  { key: 'personalMessage', label: 'Lời nhắn khách', type: 'text', scope: 'guest' },
  { key: 'bridePhoto', label: 'Ảnh cô dâu', type: 'image', scope: 'event' },
  { key: 'brideBio', label: 'Giới thiệu cô dâu', type: 'richtext', scope: 'event', defaultValue: 'Cô dâu hiền hậu, yêu hoa và trà.' },
  { key: 'groomPhoto', label: 'Ảnh chú rể', type: 'image', scope: 'event' },
  { key: 'groomBio', label: 'Giới thiệu chú rể', type: 'richtext', scope: 'event', defaultValue: 'Chú rể trầm tính, thích du lịch.' },
  { key: 'familiesTitle', label: 'Tiêu đề gia đình', type: 'text', scope: 'event', defaultValue: 'Hai bên gia đình' },
  { key: 'brideFather', label: 'Bố cô dâu', type: 'text', scope: 'event' },
  { key: 'brideMother', label: 'Mẹ cô dâu', type: 'text', scope: 'event' },
  { key: 'brideFamilyNote', label: 'Ghi chú nhà gái', type: 'text', scope: 'event' },
  { key: 'groomFather', label: 'Bố chú rể', type: 'text', scope: 'event' },
  { key: 'groomMother', label: 'Mẹ chú rể', type: 'text', scope: 'event' },
  { key: 'groomFamilyNote', label: 'Ghi chú nhà trai', type: 'text', scope: 'event' },
  { key: 'storyItems', label: 'Mốc chuyện tình', type: 'json', scope: 'event', defaultValue: [
    { year: '2019', title: 'Gặp nhau', text: 'Một buổi cà phê tình cờ.' },
    { year: '2023', title: 'Cầu hôn', text: 'Lời hứa cho cả đời.' },
  ] },
  { key: 'galleryImages', label: 'Album ảnh', type: 'gallery', scope: 'event' },
  { key: 'ceremonyTime', label: 'Giờ lễ cưới', type: 'text', scope: 'event', defaultValue: '09:00' },
  { key: 'ceremonyVenue', label: 'Địa điểm lễ', type: 'text', scope: 'event' },
  { key: 'receptionTime', label: 'Giờ tiệc', type: 'text', scope: 'event', defaultValue: '18:00' },
  { key: 'receptionVenue', label: 'Địa điểm tiệc', type: 'text', scope: 'event' },
  { key: 'mapQuery', label: 'Địa chỉ / Google Maps', type: 'map', scope: 'event' },
  { key: 'dressCode', label: 'Dress code', type: 'text', scope: 'event', defaultValue: 'Formal / Pastel' },
  { key: 'coupleMessage', label: 'Lời của cặp đôi', type: 'richtext', scope: 'event', defaultValue: 'Cảm ơn vì đã đến chia vui cùng chúng mình.' },
  { key: 'audioUrl', label: 'Nhạc nền', type: 'url', scope: 'event' },
];

const SECTION_VARS: Record<string, string[]> = {
  [TemplateSectionType.COVER]: ['coverImageUrl', 'eventTitle', 'brideName', 'groomName', 'eventDate'],
  [TemplateSectionType.INVITE_HERO]: ['guestName', 'personalMessage'],
  [TemplateSectionType.COUNTDOWN]: ['eventDate'],
  [TemplateSectionType.COUPLE]: ['brideName', 'bridePhoto', 'brideBio', 'groomName', 'groomPhoto', 'groomBio'],
  [TemplateSectionType.FAMILIES]: [
    'familiesTitle',
    'brideFather',
    'brideMother',
    'brideFamilyNote',
    'groomFather',
    'groomMother',
    'groomFamilyNote',
  ],
  [TemplateSectionType.LOVE_STORY]: ['storyItems'],
  [TemplateSectionType.GALLERY]: ['galleryImages'],
  [TemplateSectionType.EVENT_INFO]: ['ceremonyTime', 'ceremonyVenue', 'receptionTime', 'receptionVenue'],
  [TemplateSectionType.MAP]: ['mapQuery'],
  [TemplateSectionType.DRESS_CODE]: ['dressCode'],
  [TemplateSectionType.WISHES]: ['coupleMessage', 'brideName', 'groomName'],
  [TemplateSectionType.GUESTBOOK]: ['brideName', 'groomName'],
  [TemplateSectionType.RSVP]: [],
  [TemplateSectionType.FOOTER]: [],
  [TemplateSectionType.AUDIO]: ['audioUrl'],
};

@Injectable()
export class TemplateSectionCompilerService {
  compile(layout?: Partial<LayoutJson> | null, variant: 'full' | 'minimal' = 'full'): CompiledTemplate {
    const layoutJson = ensureSectionIds((layout as LayoutJson) || defaultWeddingLayout(variant));
    const htmlParts = layoutJson.sections
      .map((section) => SECTION_HTML[section.type] || '')
      .filter(Boolean);
    const html = `<div class="el-invite-root">\n${htmlParts.join('\n')}\n</div>`;
    const theme = layoutJson.theme || DEFAULT_THEME;
    const css = `${BASE_SECTION_CSS}
.el-invite-root {
  --el-primary-color: ${theme.primaryColor};
  --el-font-heading: ${theme.fontHeading};
  --el-font-body: ${theme.fontBody};
  --el-background: ${theme.background};
}`;
    const keys = new Set<string>();
    for (const section of layoutJson.sections) {
      for (const key of SECTION_VARS[section.type] || []) {
        keys.add(key);
      }
    }
    const variablesSchema = VARIABLE_CATALOG.filter((item) => keys.has(item.key));
    return { html, css, variablesSchema, layoutJson };
  }

  starters() {
    const full = this.compile(defaultWeddingLayout('full'), 'full');
    const minimal = this.compile(defaultWeddingLayout('minimal'), 'minimal');
    return [
      {
        id: 'wedding-classic',
        name: 'Cưới cổ điển',
        type: 'WEDDING',
        description: 'Trang dài đầy đủ: gia đình, album, map, lời chúc',
        ...full,
      },
      {
        id: 'wedding-minimal',
        name: 'Cưới tối giản',
        type: 'WEDDING',
        description: 'Cover, cặp đôi, lễ tiệc, map, RSVP',
        ...minimal,
      },
    ];
  }
}
