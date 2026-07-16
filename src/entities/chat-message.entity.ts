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
import { MessageKind } from '../enums/chat.enum';
import { ChatConversation } from './chat-conversation.entity';
import { User } from './user.entity';

@Entity('chat_message')
@Unique(['conversationId', 'senderId', 'clientMsgId'])
@Index(['conversationId', 'id'])
@Index(['senderId'])
export class ChatMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  conversationId: number;

  @ManyToOne(() => ChatConversation, (c) => c.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatConversation;

  @Column({ type: 'int' })
  senderId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'senderId' })
  sender: User;

  @Column({ type: 'enum', enum: MessageKind, default: MessageKind.TEXT })
  kind: MessageKind;

  @Column({ type: 'text', nullable: true })
  body: string | null;

  /** Attachment metadata: [{ url, mime, name, size }]. */
  @Column({ type: 'json', nullable: true })
  attachments: Record<string, unknown>[] | null;

  /** Client-generated id for optimistic UI + idempotent retries. */
  @Column({ type: 'varchar', length: 64 })
  clientMsgId: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @Column({ type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
