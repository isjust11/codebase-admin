import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity()
export class FcmToken {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column()
  token: string;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  deviceId: string;

  @Column({ nullable: true })
  platform: string; // ios | android | web

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}


