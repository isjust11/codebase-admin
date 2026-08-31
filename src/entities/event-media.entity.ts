import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Transform } from 'class-transformer';
import { Event } from './event.entity';

export enum EventMediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
}

/**
 * Stores typed media assets (images, videos, audio) associated with an Event.
 * Each row represents one media item belonging to a named group (e.g. "album", "highlight_video").
 * This table is separate from events.eventData (JSON) which holds scalar fields like names, dates, colors.
 */
@Entity('event_media')
@Index(['eventId', 'groupKey'])
export class EventMedia {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  /**
   * Logical group this media item belongs to.
   * Examples: "album", "highlight_video", "moments", "ceremony_photos"
   */
  @Column({ length: 100 })
  groupKey: string;

  @Column({ type: 'varchar', length: 16, default: EventMediaType.IMAGE })
  type: EventMediaType;

  /** Publicly accessible URL of the media file */
  @Column({ length: 1024 })
  url: string;

  /** Optional caption / alt text shown beneath the media */
  @Column({ length: 512, nullable: true })
  caption?: string;

  /** MIME type of the uploaded file, e.g. "image/jpeg", "video/mp4" */
  @Column({ length: 128, nullable: true })
  mimeType?: string;

  /** File size in bytes */
  @Column({ type: 'int', nullable: true })
  fileSize?: number;

  /** Image/video width in pixels */
  @Column({ type: 'int', nullable: true })
  width?: number;

  /** Image/video height in pixels */
  @Column({ type: 'int', nullable: true })
  height?: number;

  /**
   * Display order within the group.
   * Lower value = shown earlier. Supports drag-and-drop reordering.
   */
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @CreateDateColumn({ type: 'timestamp' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  updatedAt: Date;
}
