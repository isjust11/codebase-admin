import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../entities/question.entity';
import { QuestionDto } from '../dtos/question.dto';

@Injectable()
export class QuestionService {
  constructor(
    @InjectRepository(Question)
    private questionRepository: Repository<Question>,
  ) {}

  async create(dto: QuestionDto): Promise<Question> {
    const entity = this.questionRepository.create(dto);
    return this.questionRepository.save(entity);
  }

  async findAll(): Promise<Question[]> {
    return this.questionRepository.find();
  }

  async findOne(id: number): Promise<Question> {
    const entity = await this.questionRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('Question not found');
    return entity;
  }

  async update(id: number, dto: QuestionDto): Promise<Question> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.questionRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.questionRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('Question not found');
  }
} 