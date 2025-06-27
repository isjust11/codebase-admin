import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm';
import { CategoryType } from './category-type.entity';
import { FoodItem } from './food-item.entity';
import { Table } from './table.entity';
import { Reservation } from './reservation.entity';
import { Order } from './order.entity';
import { Feature } from './feature.entity';
import { features } from 'process';

@Entity()
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({default:''})
  icon: string;

  @Column({
    type: 'enum',
    enum: ['lucide', 'emoji'], // Adjust this enum based on your actual icon types
    default: 'lucide', // Default value, adjust as necessary
  })
  iconType: string; // Assuming this is a string, adjust as necessary
  
  @Column({ nullable: true })
  iconSize: number;

  @Column({ nullable: true })
  className: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({default: null})
  code: string;

  @Column({default: true})
  allowEdit: boolean;

  @ManyToOne(() => CategoryType, (cat) => cat.categories)
  @JoinColumn({ name: 'categoryTypeId' })
  type: CategoryType;

  @Column()
  categoryTypeId: string;

  @OneToMany(() => FoodItem, foodItem => foodItem.foodCategory)
  foodItems: FoodItem[];

  @OneToMany(() => FoodItem, foodItem => foodItem.statusCategory)
  foodStatusItems: FoodItem[];

  @OneToMany(() => FoodItem, foodItem => foodItem.unitCategory)
  foodUnitItems: FoodItem[];

  @OneToMany(() => Table, table => table.tableType)
  tableType: Table[];

  @OneToMany(() => Table, table => table.tableStatus)
  tableStatus: Table[];

  @OneToMany(() => Table, table => table.tableArea)
  tableArea: Table[];

  @OneToMany(() => Reservation, res => res.reservationStatus)
  reservation: Reservation[];

  @OneToMany(() => Order, order => order.orderStatus)
  orders: Order[];

  @OneToMany(() => Feature, features => features.featureType)
  feature: Feature[];

  @Column({
    default:0
  })
  sortOrder: number;

  @Column({
    default:false
  })
  isDefault: boolean;
  
  @Column({ nullable: true })
  createBy: string;

 @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
