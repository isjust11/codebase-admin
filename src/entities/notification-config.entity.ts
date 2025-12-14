import { Entity, PrimaryGeneratedColumn, Column, Index, JoinColumn, ManyToOne } from 'typeorm';
import { User } from './user.entity';

@Entity()
@Index(['userId', 'key'], { unique: true })
export class NotificationConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  @Index()
  userId: number;

  @Column()
  key: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @Column({ type: 'json', nullable: true })
  jsonValue: any;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  isDefault: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @ManyToOne(() => User, user => user.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'userId' })
  user?: User | null;
}


