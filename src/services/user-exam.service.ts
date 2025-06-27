import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserExam } from '../entities/user-exam.entity';
import { UserExamDto } from '../dtos/user-exam.dto';

@Injectable()
export class UserExamService {
  constructor(
    @InjectRepository(UserExam)
    private userExamRepository: Repository<UserExam>,
  ) {}

  async create(dto: UserExamDto): Promise<UserExam> {
    const entity = this.userExamRepository.create(dto);
    return this.userExamRepository.save(entity);
  }

  async findAll(): Promise<UserExam[]> {
    return this.userExamRepository.find();
  }

  async findOne(id: number): Promise<UserExam> {
    const entity = await this.userExamRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('UserExam not found');
    return entity;
  }

  async update(id: number, dto: UserExamDto): Promise<UserExam> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.userExamRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userExamRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('UserExam not found');
  }

  async findByUser(userId: number): Promise<UserExam[]> {
    return this.userExamRepository.find({ where: { userId } });
  }

  async findActivatedByUser(userId: number): Promise<UserExam[]> {
    return this.userExamRepository.find({ where: { userId, isActivated: true } });
  }

  async payForExam(userId: number, examId: number, paymentInfo: Partial<UserExam>): Promise<UserExam> {
    let userExam = await this.userExamRepository.findOne({ where: { userId, examId } });
    if (!userExam) {
      userExam = this.userExamRepository.create({ userId, examId });
    }
    Object.assign(userExam, {
      isPaid: true,
      paidAt: new Date(),
      paymentMethod: paymentInfo.paymentMethod,
      transactionId: paymentInfo.transactionId,
      paymentStatus: 'completed',
    });
    return this.userExamRepository.save(userExam);
  }

  async activateExamForUser(userId: number, examId: number): Promise<UserExam> {
    const userExam = await this.userExamRepository.findOne({ where: { userId, examId } });
    if (!userExam || !userExam.isPaid) throw new NotFoundException('Exam chưa được thanh toán');
    userExam.isActivated = true;
    userExam.activatedAt = new Date();
    return this.userExamRepository.save(userExam);
  }
} 