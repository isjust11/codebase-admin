import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from './category.entity';
import { Reservation } from './reservation.entity';

@Entity()
export class Table {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  imageUrl: string; // URL của hình ảnh bàn

  // Số lượng ghế ngồi
  @Column()
  capacity: number;

  @ManyToOne(() => Category, category => category.tableType, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'tableTypeId' })
  tableType: Category;

  @ManyToOne(() => Category, category => category.tableStatus, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'tableStatusId' })
  tableStatus: Category;

  @ManyToOne(() => Category, category => category.tableArea, { onDelete: 'CASCADE', onUpdate: 'NO ACTION' })
  @JoinColumn({ name: 'areaId' })
  tableArea: Category;

  @ManyToOne(() => Reservation, reservation => reservation.tableReservations
    , { onDelete: 'CASCADE', onUpdate: 'NO ACTION', })
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;


  @Column({ nullable: true, default: null })
  reservationId: number;

  @Column({ nullable: true, default: null})
  areaId: string; // ID của khu vực bàn

  @Column({ nullable: true, default: null })
  tableStatusId: string;

  @Column({ nullable: true, default: null })
  tableTypeId: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}

