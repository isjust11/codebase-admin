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
  layoutJson: LayoutJson;
};

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
    return { html, css, layoutJson };
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
