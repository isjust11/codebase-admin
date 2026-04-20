import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dtos/auth.dto';
import { Role } from '../entities/role.entity';
import { UpdateUserDto } from '../dtos/user.dto';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';
import { RoleEnum } from 'src/enums/role.enum';
import { SubscriptionPlan } from 'src/entities/subscription-plan.entity';
import { SubscriptionPlanEnum } from 'src/enums/subscription-plan.enum';
import { SubscriptionStatus, UserSubscription } from 'src/entities/user-subscription.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(SubscriptionPlan)
    private subscriptionPlanRepository: Repository<SubscriptionPlan>,
    @InjectRepository(UserSubscription)
    private userSubscriptionRepository: Repository<UserSubscription>,
  ) { }

  async findAllWithPagination(params: PaginationParams): Promise<PaginatedResponse<User>> {
    const { page = 1, size = 10, search = '' } = params;
    const skip = (page - 1) * size;

    const whereConditions = search ? [
      { username: Like(`%${search}%`) },
      { fullName: Like(`%${search}%`) },
    ] : {};

    const [data, total] = await this.userRepository.findAndCount({
      where: whereConditions,
      skip,
      take: size,
      relations: ['roles',],
      order: { id: 'DESC' },
    });

    return {
      data,
      total,
      page,
      size,
      totalPages: Math.ceil(total / size),
    };
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['roles'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['roles'],
    });
  }

  async create(createUserDto: RegisterDto): Promise<User> {

    const user = this.userRepository.create({
      username: createUserDto.username,
      password: createUserDto.password,
      fullName: createUserDto.fullName,
      email: createUserDto.email,
      isAdmin: createUserDto.isAdmin || false,
      platformId: createUserDto.platformId,
      picture: createUserDto.picture,
      isGoogleUser: createUserDto.isGoogleUser || false,
      isFacebookUser: createUserDto.isFacebookUser || false,
      isAppleUser: createUserDto.isAppleUser || false,
      isWebsiteUser: createUserDto.isWebsiteUser || false,
      verificationToken: createUserDto.verificationToken,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Kiểm tra xem đây có phải là tài khoản đầu tiên không
    const userCount = await this.count();
    const isFirstUser = userCount === 0;

    // Tìm subscription plan FREE
    const freeSubscriptionPlan = await this.createFreeSubscription(user.id);

    // Tìm role ADMIN nếu là tài khoản đầu tiên
    let roleIds: number[] = [];
    if (isFirstUser) {
      const superAdminRole = await this.roleRepository.findOne({
        where: {
          code: RoleEnum.SUPPER_ADMIN,
        },
      });
      if (superAdminRole) {
        roleIds = [superAdminRole.id];
      }
      user.roles = [superAdminRole!];
      user.isAdmin = true;
    } else {
      const adminRole = await this.roleRepository.findOne({
        where: {
          code: RoleEnum.ADMIN,
        },
      });
      if (adminRole) {
        roleIds = [adminRole.id];
      }
      user.roles = [adminRole!];
    }

    const savedUser = await this.userRepository.save(user);
    if (savedUser) {
      // Tạo user subscription
      const userSubscription = this.userSubscriptionRepository.create({
        user: savedUser,
        userId: savedUser.id,
        planId: freeSubscriptionPlan.id,
        plan: freeSubscriptionPlan,
        startedAt: new Date(),
        expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
        status: SubscriptionStatus.ACTIVE,
      });
      await this.userSubscriptionRepository.save(userSubscription);
    }
    return savedUser;
  }

  async createFreeSubscription(userId: number): Promise<SubscriptionPlan> {
    let freeSubscriptionPlan = await this.subscriptionPlanRepository.findOne({
      where: {
        code: SubscriptionPlanEnum.FREE,
      },
    });

    if (!freeSubscriptionPlan) {
      // create subscription plan FREE
      freeSubscriptionPlan = await this.subscriptionPlanRepository.create({
        code: SubscriptionPlanEnum.FREE,
        name: 'Free',
        description: 'Free subscription plan',
        storageLimitBytes: '1073741824',
        ttsLimitPerPeriod: 100000,
        convertLimitPerPeriod: 10,
        shareLimitPerPeriod: 10,
        downloadLimitPerPeriod: 10,
        periodType: 'month',
        price: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      freeSubscriptionPlan = await this.subscriptionPlanRepository.save(freeSubscriptionPlan);
    }
    return freeSubscriptionPlan;
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID ${id}`);
    }
    Object.assign(user, updateUserDto);

    // if (updateUserDto.fullName !== undefined) {
    //   user.fullName = updateUserDto.fullName;
    // }

    // if (updateUserDto.email !== undefined) {
    //   user.email = updateUserDto.email;
    // }

    // if (updateUserDto.isAdmin !== undefined) {
    //   user.isAdmin = updateUserDto.isAdmin;
    // }

    // if (updateUserDto.platformId !== undefined) {

    //   user.platformId = updateUserDto.platformId;
    // }

    // if (updateUserDto.picture !== undefined) {
    //   user.picture = updateUserDto.picture;
    // }

    // if (updateUserDto.isGoogleUser !== undefined) {
    //   user.isGoogleUser = updateUserDto.isGoogleUser;
    // }

    // if (updateUserDto.isFacebookUser !== undefined) {
    //   user.isFacebookUser = updateUserDto.isFacebookUser;
    // }

    // if (updateUserDto.verificationToken !== undefined) {
    //   user.verificationToken = updateUserDto.verificationToken;
    // }

    // if (updateUserDto.isEmailVerified !== undefined) {
    //   user.isEmailVerified = updateUserDto.isEmailVerified;
    // }

    // if (updateUserDto.password !== undefined) {
    //   user.password = updateUserDto.password;
    // }

    // if (updateUserDto.lastLogin !== undefined) {
    //   user.lastLogin = updateUserDto.lastLogin;
    // }

    // // update pinCode và pinExpiresAt
    // if (updateUserDto.pinCode !== undefined) {
    //   user.pinCode = updateUserDto.pinCode;
    // }
    // user.pinExpiresAt = updateUserDto.pinExpiresAt;

    // if (updateUserDto.isEmailVerified !== undefined) {
    //   user.isEmailVerified = updateUserDto.isEmailVerified;
    // }

    // if (updateUserDto.verificationToken !== undefined) {
    //   user.verificationToken = updateUserDto.verificationToken;
    // }

    user.updatedAt = new Date();

    if (updateUserDto.roleIds) {
      const roles = await this.roleRepository.find({
        where: { id: In(updateUserDto.roleIds) },
      });
      user.roles = roles;
    }

    return this.userRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID ${id}`);
    }
  }

  async findByUsername(username: string, includePassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.username = :username', { username });

    if (includePassword) {
      query.addSelect('user.password');
    }

    return query.getOne();
  }

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.userRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.email = :email', { email });

    if (includePassword) {
      query.addSelect('user.password');
    }

    return query.getOne();
  }

  async findByPinCode(pinCode: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { pinCode } });
  }

  async findByEmailSocial(email: string, platformId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email, platformId }, relations: ['roles', 'roles.permissions'] });
  }

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { verificationToken: token } });
  }

  async blockUser(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID ${id}`);
    }
    user.isBlocked = true;
    return this.userRepository.save(user);
  }

  async unblockUser(id: number): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID ${id}`);
    }
    user.isBlocked = false;
    return this.userRepository.save(user);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }

  async findRoleByCode(code: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { code }
    });
  }
} 