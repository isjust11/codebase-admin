import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { ConversationMemberRole } from '../enums/chat.enum';
import { ChatConversation } from './chat-conversation.entity';
import { User } from './user.entity';

@Entity('chat_conversation_member')
@Unique(['conversationId', 'userId'])
@Index(['userId', 'appId'])
@Index(['conversationId', 'userId'])
export class ChatConversationMember {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'bigint' })
  conversationId: number;

  @ManyToOne(() => ChatConversation, (c) => c.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'conversationId' })
  conversation: ChatConversation;

  @Column({ type: 'int' })
  userId: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /** Denormalized for inbox queries filtered by app. */
  @Column({ length: 64, default: 'green_vietnam' })
  appId: string;

  @Column({
    type: 'enum',
    enum: ConversationMemberRole,
    default: ConversationMemberRole.MEMBER,
  })
  role: ConversationMemberRole;

  @Column({ type: 'bigint', nullable: true })
  lastReadMessageId: number | null;

  @Column({ type: 'datetime', nullable: true })
  mutedUntil: Date | null;

  @Column({ type: 'datetime', nullable: true })
  joinedAt: Date | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
