import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Transform } from 'class-transformer';
import { User } from './user.entity';
import { Template } from './template.entity';
import { Guest } from './guest.entity';
import { EventStatus } from '../enums/event-status.enum';
import { TemplateType } from '../enums/template-type.enum';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user?: User;

  @Column({ nullable: true })
  templateId?: number;

  @ManyToOne(() => Template, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'templateId' })
  template?: Template;

  /** Public invite slug for React host: GET /public/events/:slug */
  @Column({ length: 255, unique: true, nullable: true })
  slug?: string;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'varchar', length: 32, default: TemplateType.EVENT })
  type: TemplateType;

  @Column({ type: 'timestamp', nullable: true })
  eventDate?: Date;

  @Column({ length: 512, nullable: true })
  venue?: string;

  @Column({ length: 512, nullable: true })
  coverImageUrl?: string;

  @Column({ type: 'json', nullable: true })
  eventData?: Record<string, any>;

  @Column({ type: 'varchar', length: 32, default: EventStatus.DRAFT })
  status: EventStatus;

  @OneToMany(() => Guest, (guest) => guest.event)
  guests?: Guest[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  updatedAt: Date;
}
