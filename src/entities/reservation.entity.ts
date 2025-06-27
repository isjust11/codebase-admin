import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Table } from "./table.entity";
import { User } from "./user.entity";
import { Category } from "./category.entity";

// thông tin đặt bàn trước
@Entity()
export class Reservation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  reservationDate: Date; // Ngày đặt bàn
  
  @Column()
  reservationTime: string; // Giờ đặt bàn

  //số lượng khách hàng
  @Column()
  partySize: number;

  @OneToMany(() => Table, table => table.reservation)
  tableReservations: Table[];

  @ManyToOne(() => User, user => user.reservations)
  @JoinColumn({ name: 'userId' })
  account: User;

  @Column()
  userId: number;

  @ManyToOne(() => Category, category => category.reservation)
  @JoinColumn({ name: 'statusId' })
  reservationStatus: Category;

  @Column()
  statusId: string;

  @Column({ nullable: true })
  requestNote: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @Column({ nullable: true })
  confirmedBy: number;

  @Column({ nullable: true })
  confirmedTime: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 