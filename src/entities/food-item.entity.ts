import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, JoinColumn, Index, Check } from 'typeorm';
import { Category } from './category.entity';
import { Length, MaxLength } from 'class-validator';

//entity món ăn
@Entity()
@Check(`"price" >= 0`)
@Check(`"preparationTime" >= 0`)
export class FoodItem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  name: string;

  @Column()
  @Index()
  price: number;

  @Column({ nullable: true })
  @MaxLength(2500, {
    message: 'Mô tả không được quá 2500 ký tự',
  })
  description?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  @Index()
  isAvailable: boolean;

  // danh mục loại món ăn món nướng, nước uống ...
  @ManyToOne(() => Category, category => category.foodItems)
  @JoinColumn({ name: 'foodCategoryId' })
  foodCategory?: Category;

  @Column({ nullable: true })
  foodCategoryId?: string;

  // Trạng thái (Status): Còn phục vụ/Hết món/Tạm ngừng
  @ManyToOne(() => Category, category => category.foodStatusItems)
  @JoinColumn({ name: 'statusCategoryId' })
  statusCategory?: Category;

  @Column({ nullable: true })
  statusCategoryId?: string;

  @ManyToOne(() => Category, category => category.foodUnitItems)
  @JoinColumn({ name: 'unitCategoryId' })
  unitCategory: Category;

  @Column({ nullable: true })
  unitCategoryId?: string;

  // thời gian chuẩn bị chế biến (phút)
  @Column({ nullable: true })
  preparationTime: number;

  @Column({ nullable: true })
  createBy: number;

  @Column({ nullable: true })
  orderCount: number;

  @Column({ nullable: true })
  discountPercent: number;

  @Column({ nullable: true })
  discountStartTime: Date;

  @Column({ nullable: true })
  discountEndTime: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}