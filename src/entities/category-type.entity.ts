import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Category } from './category.entity';

@Entity()
export class CategoryType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string;

  @Column()
  name: string;

  @Column({ nullable: true })
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


  @Column({ nullable: true })
  description: string;

  @Column({default: true})
  isActive: boolean; // Assuming this is a string, adjust as necessary

  @CreateDateColumn()
  createDate: Date;

  @UpdateDateColumn()
  updateDate: Date;

  @OneToMany(() => Category, (category) => category.type, { cascade: true })
  categories: Category[];
   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;
}
