import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user.entity";
import { Category } from "./category.entity";
import { OrderItem } from "./order-item.entity";
import { Table } from "./table.entity";

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, user => user.orders)
  @JoinColumn({ name: 'userId' })
  account: User;

  @Column()
  userId: number;

  @ManyToOne(() => Table)
  @JoinColumn({ name: 'tableId' })
  table: Table;

  @Column()
  tableId: number;

  @ManyToOne(() => Category, category => category.sortOrder)
  @JoinColumn({ name: 'statusId' })
  orderStatus: Category;

  @Column({ nullable: true })
  statusId: string;

  @OneToMany(() => OrderItem, orderItem => orderItem.order)
  orderItems: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  paymentStatus: string;

  @Column({ nullable: true })
  note: string;

 @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
} 