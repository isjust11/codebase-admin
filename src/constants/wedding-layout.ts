import { TemplateSectionType } from '../enums/template-section-type.enum';

export type LayoutTheme = {
  primaryColor: string;
  fontHeading: string;
  fontBody: string;
  background: string;
};

export type LayoutSection = {
  id: string;
  type: TemplateSectionType | string;
  props?: Record<string, any>;
};

export type LayoutJson = {
  version: 1;
  theme: LayoutTheme;
  sections: LayoutSection[];
};

export const DEFAULT_THEME: LayoutTheme = {
  primaryColor: '#c9a227',
  fontHeading: '"Playfair Display", serif',
  fontBody: '"Source Sans 3", "Noto Sans", sans-serif',
  background: '#f7f0e8',
};

export const SECTION_CATALOG: Array<{
  type: TemplateSectionType;
  label: string;
  group: 'core' | 'extra';
}> = [
  { type: TemplateSectionType.COVER, label: 'Cover', group: 'core' },
  { type: TemplateSectionType.INVITE_HERO, label: 'Kính mời', group: 'core' },
  { type: TemplateSectionType.COUNTDOWN, label: 'Countdown', group: 'extra' },
  { type: TemplateSectionType.COUPLE, label: 'Cô dâu & chú rể', group: 'core' },
  { type: TemplateSectionType.FAMILIES, label: 'Hai bên gia đình', group: 'core' },
  { type: TemplateSectionType.LOVE_STORY, label: 'Chuyện tình', group: 'extra' },
  { type: TemplateSectionType.GALLERY, label: 'Album', group: 'core' },
  { type: TemplateSectionType.EVENT_INFO, label: 'Lễ & tiệc', group: 'core' },
  { type: TemplateSectionType.MAP, label: 'Bản đồ', group: 'core' },
  { type: TemplateSectionType.DRESS_CODE, label: 'Dress code', group: 'extra' },
  { type: TemplateSectionType.WISHES, label: 'Lời của cặp đôi', group: 'extra' },
  { type: TemplateSectionType.GUESTBOOK, label: 'Sổ lời chúc', group: 'extra' },
  { type: TemplateSectionType.RSVP, label: 'RSVP', group: 'core' },
  { type: TemplateSectionType.FOOTER, label: 'Footer', group: 'core' },
  { type: TemplateSectionType.AUDIO, label: 'Nhạc nền', group: 'extra' },
];

const CORE_TYPES: TemplateSectionType[] = [
  TemplateSectionType.COVER,
  TemplateSectionType.INVITE_HERO,
  TemplateSectionType.COUPLE,
  TemplateSectionType.FAMILIES,
  TemplateSectionType.GALLERY,
  TemplateSectionType.EVENT_INFO,
  TemplateSectionType.MAP,
  TemplateSectionType.RSVP,
  TemplateSectionType.FOOTER,
];

const FULL_TYPES: TemplateSectionType[] = [
  TemplateSectionType.COVER,
  TemplateSectionType.INVITE_HERO,
  TemplateSectionType.COUNTDOWN,
  TemplateSectionType.COUPLE,
  TemplateSectionType.FAMILIES,
  TemplateSectionType.LOVE_STORY,
  TemplateSectionType.GALLERY,
  TemplateSectionType.EVENT_INFO,
  TemplateSectionType.MAP,
  TemplateSectionType.WISHES,
  TemplateSectionType.GUESTBOOK,
  TemplateSectionType.RSVP,
  TemplateSectionType.FOOTER,
];

function makeSections(types: TemplateSectionType[]): LayoutSection[] {
  return types.map((type, index) => ({
    id: `${type}-${index + 1}`,
    type,
    props: {},
  }));
}

export function defaultWeddingLayout(variant: 'full' | 'minimal' = 'full'): LayoutJson {
  return {
    version: 1,
    theme: { ...DEFAULT_THEME },
    sections: makeSections(variant === 'minimal' ? CORE_TYPES : FULL_TYPES),
  };
}

export function ensureSectionIds(layout: LayoutJson): LayoutJson {
  return {
    version: 1,
    theme: { ...DEFAULT_THEME, ...(layout?.theme || {}) },
    sections: (layout?.sections || []).map((section, index) => ({
      id: section.id || `${section.type}-${index + 1}`,
      type: section.type,
      props: section.props || {},
    })),
  };
}
