import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Transform } from 'class-transformer';
import { Event } from './event.entity';
import { Guest } from './guest.entity';
import { WishStatus } from '../enums/wish-status.enum';

@Entity('wishes')
export class Wish {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  eventId: number;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ nullable: true })
  guestId?: number;

  @ManyToOne(() => Guest, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'guestId' })
  guest?: Guest;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 24, default: WishStatus.PENDING })
  status: WishStatus;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => (value ? new Date(value) : value))
  createdAt: Date;
}
