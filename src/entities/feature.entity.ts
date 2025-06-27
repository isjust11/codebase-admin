import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { IconType } from 'src/enums/icon-type.enum';
import { Category } from './category.entity';

@Entity()
export class Feature {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({default: null})
  icon: string;

  @Column()
  label: string;

  @Column({ nullable: true })
  link?: string;

  @Column({ nullable: true })
  parentId?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  sortOrder?: number;

  @Column({
    type: 'enum',
    enum: IconType,
    default: null
  })
  iconType?: IconType;

  @Column({ default: 20 })
  iconSize: number;

  @Column({ default: '' })
  className?: string;

  @ManyToOne(() => Feature, feature => feature.children, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  })
  @JoinColumn({ name: 'parentId' })
  parent?: Feature;

  @OneToMany(() => Feature, feature => feature.parent)
  children?: Feature[];

  @ManyToOne(() => Category, category => category.feature, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'featureTypeId' })
  featureType: Category;

  @Column({ nullable: true })
  featureTypeId: string;


  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;


} 