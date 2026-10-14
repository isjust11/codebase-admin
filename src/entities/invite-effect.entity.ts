import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export type InviteEffectKind = 'burst' | 'ambient' | 'gate' | 'scroll' | 'audio';

@Entity('invite_effects')
export class InviteEffect {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  slug: string;

  @Column()
  themeKey: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: 'ambient' })
  kind: InviteEffectKind;

  @Column({ default: true })
  defaultEnabled: boolean;

  @Column({ type: 'json', nullable: true })
  options?: Record<string, unknown> | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
