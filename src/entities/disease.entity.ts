import { Entity, Column, PrimaryGeneratedColumn, ManyToMany, JoinTable } from 'typeorm';
import { FolkMedicine } from './folk-medicine.entity';
import { Transform } from 'class-transformer';

@Entity()
export class Disease {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 255, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  symptoms?: string;

  @Column({ type: 'text', nullable: true })
  causes?: string;

  @Column({ type: 'text', nullable: true })
  prevention?: string;

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => FolkMedicine, folkMedicine => folkMedicine.diseases)
  @JoinTable({
    name: 'folk_medicine_diseases',
    joinColumn: {
      name: 'diseaseId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'folkMedicineId',
      referencedColumnName: 'id',
    },
  })
  folkMedicines?: FolkMedicine[];

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  @Transform(({ value }) => value ? new Date(value) : value)
  updatedAt: Date;
}

