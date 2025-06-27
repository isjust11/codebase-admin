import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Reservation } from "./reservation.entity";
import { Order } from "./order.entity";

export enum HistoryType {
  RESERVATION = 'RESERVATION',
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT'
}

export enum HistoryAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  CONFIRM = 'CONFIRM',
  CANCEL = 'CANCEL',
  PAY = 'PAY'
}

@Entity()
export class History {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: HistoryType
  })
  type: HistoryType;

  @Column({
    type: 'enum',
    enum: HistoryAction
  })
  action: HistoryAction;

  @Column({ nullable: true })
  reservationId: number;

  @ManyToOne(() => Reservation, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reservationId' })
  reservation: Reservation;

  @Column({ nullable: true })
  orderId: number;

  @ManyToOne(() => Order, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @Column()
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'json', nullable: true })
  oldData: any;

  @Column({ type: 'json', nullable: true })
  newData: any;

  @Column({ nullable: true })
  description: string;

 @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 