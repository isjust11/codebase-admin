import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ExamQuestion } from './exam-question.entity';
import { SkillType } from '../enums/skill-type.enum';
import { QuestionType } from '../enums/question-type.enum';

@Entity()
export class Question {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'enum', enum: SkillType })
  skill: SkillType;

  @Column({ type: 'enum', enum: QuestionType, nullable: true })
  type?: QuestionType;

  @Column('simple-array', { nullable: true })
  options?: string[];

  @Column({ type: 'json', nullable: true })
  answer?: any;

  @Column({ nullable: true })
  explanation?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => ExamQuestion, eq => eq.question)
  examQuestions: ExamQuestion[];
} 