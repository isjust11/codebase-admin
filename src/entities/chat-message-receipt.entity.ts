import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Unique,
} from 'typeorm';
import { MessageReceiptStatus } from '../enums/chat.enum';
import { ChatMessage } from './chat-message.entity';
import { User } from './user.entity';

@Entity('chat_message_receipt')
@Unique(['messageId', 'userId'])
@Index(['userId', 'status'])
export class ChatMessageReceipt {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  messageId: number;

  @ManyToOne(() => ChatMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'messageId' })
  message: ChatMessage;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ type: 'enum', enum: MessageReceiptStatus })
  status: MessageReceiptStatus;

  @CreateDateColumn({ type: 'datetime' })
  at: Date;
}
