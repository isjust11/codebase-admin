import { Entity, Column, PrimaryGeneratedColumn, BeforeInsert, ManyToMany, JoinTable, BeforeUpdate, JoinColumn, OneToOne, OneToMany } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Role } from './role.entity';
import { Exclude } from 'class-transformer';
import { UserSubscription } from './user-subscription.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ select: false })
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

  @Column({ nullable: true, select: false })
  verificationToken: string;

  @Column({ nullable: true, select: true })
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
  birthDate?: Date;

  @Column({ nullable: true })
  facebookLink: string;

  @Column({ nullable: true })
  instagramLink: string;

  @Column({ nullable: true })
  twitterLink: string;

  @Column({ nullable: true })
  linkedinLink: string;

  @Column({ nullable: true })
  countryCode: string;

  @Column({ nullable: true })
  region: string;

  @Column({ nullable: true })
  isDeleted: boolean;

  @Column({ nullable: true })
  deletedAt: Date;

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

 get getLanguage(): string {
    if (this.region) {
      return this.region.split('-')[0].toLowerCase();
    }
    return 'en';
  }

  // @Column({ type: 'json', nullable: true })
  permissions: string[];

  @OneToMany(() => UserSubscription, (sub) => sub.user)
  subscriptions: UserSubscription[];

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 