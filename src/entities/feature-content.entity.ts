import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Feature } from './feature.entity';

@Entity()
export class FeatureContent {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'featureId' })
  feature: Feature;

  @Column()
  featureId: number;

  @Column()
  type: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  sortOrder?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 