import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, ManyToMany, JoinTable, BeforeUpdate, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';
import { Exclude } from 'class-transformer';
import { Reservation } from './reservation.entity';
import { Order } from './order.entity';
import { UserInteraction } from './user-interaction.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ default: false })
  isBlocked: boolean;

  @Column({ nullable: true })
  fullName: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  platformId: string;

  @Column({ nullable: true })
  picture: string;

  @Column({ default: false })
  isGoogleUser: boolean;

  @Column({ default: false })
  isFacebookUser: boolean;

  @Column({ default: false })
  isAppleUser: boolean;

  @Column({ nullable: true })
  isWebsiteUser: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({ nullable: true })
  verificationToken: string;

  @Column({ nullable: true })
  pinCode?: string;

  @Column({ nullable: true })
  pinExpiresAt?: Date;

  @Column({ nullable: true })
  lastLogin: Date;

  @Column({ nullable: true })
  phoneNumber: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  birthDate: Date;

  @Column({ nullable: true })
  facebookLink: string;

  @Column({ nullable: true })
  instagramLink: string;

  @Column({ nullable: true })
  twitterLink: string;

  @Column({ nullable: true })
  linkedinLink: string;

  @ManyToMany(() => Role)
  @JoinTable({
    name: 'user_roles',
    joinColumn: {
      name: 'userId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'roleId',
      referencedColumnName: 'id',
    },
  })
  roles: Role[];

   @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => Reservation, reservation => reservation.account)
  reservations: Reservation[];

  @OneToMany(() => Order, order => order.account)
  orders: Order[];

  @OneToMany(() => UserInteraction, interaction => interaction.user)
  interactions: UserInteraction[];

  @Column({ type: 'json', nullable: true })
  permissions: string[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 