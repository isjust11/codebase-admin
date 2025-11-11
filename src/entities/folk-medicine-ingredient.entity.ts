import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { FolkMedicine } from './folk-medicine.entity';
import { Herbal } from './herbal.entity';
import { Category } from './category.entity';

@Entity()
export class FolkMedicineIngredient {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => FolkMedicine, folk => folk.ingredientsDetail, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'folkMedicineId' })
  folkMedicine: FolkMedicine;

  @Column()
  @Index()
  folkMedicineId: number;

  @ManyToOne(() => Herbal, herbal => herbal.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'herbalId' })
  herbal: Herbal;

  @Column()
  @Index()
  herbalId: number;

  @ManyToOne(() => Category, category => category.id, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'unitCategoryId' })
  unitCategory?: Category | null;

  @Column({ nullable: true })
  unitCategoryId?: number;

  @Column('decimal', { precision: 12, scale: 3 })
  quantity: number;

  @Column({ nullable: true })
  note?: string;

  @Column({ default: 0 })
  sortOrder: number;
}


