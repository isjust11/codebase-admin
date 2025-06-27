import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Like, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { RegisterDto } from '../dtos/auth.dto';
import { Role } from '../entities/role.entity';
import { UpdateUserDto } from '../dtos/user.dto';
import { RoleEnum } from 'src/enums/role.enum';
import { PaginatedResponse, PaginationParams } from 'src/dtos/filter.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
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

    // Tìm role ADMIN nếu là tài khoản đầu tiên
    let roleIds: number[] = [];
    if (isFirstUser) {
      const adminRole = await this.roleRepository.findOne({
        where: {
          code: RoleEnum.ADMIN,
        },
      });
      if (adminRole) {
        roleIds = [adminRole.id];
      }
      user.roles = [adminRole!];
      user.isAdmin = isFirstUser;
    } else {
      const roleCustomer = await this.roleRepository.findOne({
        where: {
          code: RoleEnum.CUSTOMER,
        },
      });
      if (roleCustomer) {
        roleIds = [roleCustomer.id];
      }
      user.roles = [roleCustomer!];
    }

    return this.userRepository.save(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Không tìm thấy tài khoản với ID ${id}`);
    }

    if (updateUserDto.fullName !== undefined) {
      user.fullName = updateUserDto.fullName;
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    if (updateUserDto.isAdmin !== undefined) {
      user.isAdmin = updateUserDto.isAdmin;
    }

    if (updateUserDto.platformId !== undefined) {

      user.platformId = updateUserDto.platformId;
    }

    if (updateUserDto.picture !== undefined) {
      user.picture = updateUserDto.picture;
    }

    if (updateUserDto.isGoogleUser !== undefined) {
      user.isGoogleUser = updateUserDto.isGoogleUser;
    }

    if (updateUserDto.isFacebookUser !== undefined) {
      user.isFacebookUser = updateUserDto.isFacebookUser;
    }

    if (updateUserDto.verificationToken !== undefined) {
      user.verificationToken = updateUserDto.verificationToken;
    }

    if (updateUserDto.isEmailVerified !== undefined) {
      user.isEmailVerified = updateUserDto.isEmailVerified;
    }

    if (updateUserDto.password !== undefined) {
      user.password = updateUserDto.password;
    }

    if (updateUserDto.lastLogin !== undefined) {
      user.lastLogin = updateUserDto.lastLogin;
    }

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

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username }, relations: ['roles','roles.navigators'] });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email }, relations: ['roles'] });
  }

  async findByEmailSocial(email: string, platformId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email, platformId }, relations: ['roles'] });
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