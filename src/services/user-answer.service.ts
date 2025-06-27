import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserAnswer } from '../entities/user-answer.entity';
import { UserAnswerDto } from '../dtos/user-answer.dto';

@Injectable()
export class UserAnswerService {
  constructor(
    @InjectRepository(UserAnswer)
    private userAnswerRepository: Repository<UserAnswer>,
  ) {}

  async create(dto: UserAnswerDto): Promise<UserAnswer> {
    const entity = this.userAnswerRepository.create(dto);
    return this.userAnswerRepository.save(entity);
  }

  async findAll(): Promise<UserAnswer[]> {
    return this.userAnswerRepository.find();
  }

  async findOne(id: number): Promise<UserAnswer> {
    const entity = await this.userAnswerRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('UserAnswer not found');
    return entity;
  }

  async update(id: number, dto: UserAnswerDto): Promise<UserAnswer> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.userAnswerRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.userAnswerRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('UserAnswer not found');
  }
} 