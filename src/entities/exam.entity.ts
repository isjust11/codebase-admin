import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ExamQuestion } from './exam-question.entity';
import { UserExam } from './user-exam.entity';

// đây là mô hình Exam, đại diện cho một bài kiểm tra trong hệ thống
@Entity()
export class Exam {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToMany(() => ExamQuestion, eq => eq.exam,{onDelete:'CASCADE'})
  examQuestions: ExamQuestion[];

  @OneToMany(() => UserExam, ue => ue.exam)
  userExams: UserExam[];
} 