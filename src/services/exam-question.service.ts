import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExamQuestion } from '../entities/exam-question.entity';
import { ExamQuestionDto } from '../dtos/exam-question.dto';

@Injectable()
export class ExamQuestionService {
  constructor(
    @InjectRepository(ExamQuestion)
    private examQuestionRepository: Repository<ExamQuestion>,
  ) {}

  async create(dto: ExamQuestionDto): Promise<ExamQuestion> {
    const entity = this.examQuestionRepository.create(dto);
    return this.examQuestionRepository.save(entity);
  }

  async findAll(): Promise<ExamQuestion[]> {
    return this.examQuestionRepository.find();
  }

  async findOne(id: number): Promise<ExamQuestion> {
    const entity = await this.examQuestionRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('ExamQuestion not found');
    return entity;
  }

  async update(id: number, dto: ExamQuestionDto): Promise<ExamQuestion> {
    const entity = await this.findOne(id);
    Object.assign(entity, dto);
    return this.examQuestionRepository.save(entity);
  }

  async remove(id: number): Promise<void> {
    const result = await this.examQuestionRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException('ExamQuestion not found');
  }
}
 