import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UserExam } from './user-exam.entity';
import { Question } from './question.entity';

@Entity()
export class UserAnswer {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => UserExam, ue => ue.userAnswers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userExamId' })
  userExam: UserExam;

  @Column()
  userExamId: number;

  @ManyToOne(() => Question, question => question.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column()
  questionId: number;

  @Column({ type: 'text', nullable: true })
  answer?: string;

  @Column({ type: 'boolean', nullable: true })
  isCorrect?: boolean;
} 