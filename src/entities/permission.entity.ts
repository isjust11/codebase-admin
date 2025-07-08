import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, ManyToOne, JoinColumn } from 'typeorm';
import { Role } from './role.entity';
import { Feature } from './feature.entity';

@Entity()
export class Permission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  code: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  action?: string;

  @Column({ nullable: true })
  resource?: string;

  @ManyToOne(() => Feature, feature => feature.permissions, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'featureId' })
  feature?: Feature;

  @Column({ nullable: true })
  featureId?: number;

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 