import { InviteEffectKind } from 'src/entities/invite-effect.entity';

export class InviteEffectDto {
  slug: string;
  themeKey: string;
  name: string;
  description?: string;
  kind?: InviteEffectKind;
  defaultEnabled?: boolean;
  options?: Record<string, unknown> | null;
  isActive?: boolean;
  sortOrder?: number;
}
