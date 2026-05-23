import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { CategoryType } from './category-type.entity';
import { Feature } from './feature.entity';
import { Book } from './book.entity';

@Entity()
export class Category {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  // bổ sung thêm trường ngôn ngữ tiếng anh cho tên và mô tả
  @Column({ nullable: true })
  nameEN: string;

  @Column({ nullable: true })
  descriptionEN: string;

  @Column({ default: '' })
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

  // URL ảnh đại diện cho danh mục (ưu tiên hơn icon khi cả 2 đều có)
  @Column({ nullable: true })
  image: string;

  // Màu chủ đạo của danh mục, lưu ở dạng HEX (#RRGGBB hoặc #RRGGBBAA)
  // FE dùng để vẽ background/gradient cho card category.
  @Column({ length: 9, nullable: true })
  color: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: null })
  code: string;

  @Column({ default: true })
  allowEdit: boolean;

  @ManyToOne(() => CategoryType, (cat) => cat.categories)
  @JoinColumn({ name: 'categoryTypeId' })
  type: CategoryType;

  @Column()
  categoryTypeId: number;

  @ManyToOne(() => Category, (category) => category.children, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @Column({ nullable: true })
  parentId: number;

  @OneToMany(() => Category, (category) => category.parent)
  children: Category[];

  @OneToMany(() => Feature, features => features.featureType)
  feature: Feature[];

  @OneToMany(() => Book, book => book.category)
  books: Book[];

  @Column({
    default: 0
  })
  sortOrder: number;

  @Column({
    default: false
  })
  isDefault: boolean;

  @Column({ nullable: true })
  createBy: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
