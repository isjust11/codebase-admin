import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Transform } from 'class-transformer';
import { Event } from './event.entity';
import { RsvpStatus } from '../enums/rsvp-status.enum';
import { GuestSource } from '../enums/guest-source.enum';

@Entity('guests')
export class Guest {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, (event) => event.guests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 64, nullable: true })
  phone?: string;

  @Column({ length: 255, nullable: true })
  email?: string;

  @Column({ length: 128, nullable: true })
  group?: string;

  @Column({ type: 'varchar', length: 32, default: GuestSource.MANUAL })
  source: GuestSource;

  @Column({ type: 'json', nullable: true })
  extraData?: Record<string, any>;

  @Index({ unique: true })
  @Column({ length: 64 })
  publicToken: string;

  @Column({ type: 'varchar', length: 32, default: RsvpStatus.PENDING })
  rsvpStatus: RsvpStatus;

  @Column({ type: 'text', nullable: true })
  rsvpNote?: string;

  @Column({ type: 'int', default: 0 })
  plusOnes: number;

  @Column({ type: 'timestamp', nullable: true })
  viewedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  sentAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Column({ length: 512, nullable: true })
  renderedImageUrl?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  updatedAt: Date;
}
