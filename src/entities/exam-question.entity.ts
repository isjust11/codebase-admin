import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exam } from './exam.entity';
import { Question } from './question.entity';

@Entity()
export class ExamQuestion {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Exam, exam => exam.examQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column()
  examId: number;

  @ManyToOne(() => Question, question => question.examQuestions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column()
  questionId: number;

  @Column({ nullable: true })
  order?: number;
} 