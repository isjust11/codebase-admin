import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ConversationType } from '../enums/chat.enum';
import { ChatConversationMember } from './chat-conversation-member.entity';
import { ChatMessage } from './chat-message.entity';

@Entity('chat_conversation')
@Index(['appId', 'dmKey'], { unique: true })
@Index(['appId', 'refType', 'refId'])
@Index(['appId', 'lastMessageAt'])
export class ChatConversation {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ length: 64, default: 'green_vietnam' })
  appId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string | null;

  /** Unique key for DM: `${minUid}:${maxUid}` within appId. Null for groups. */
  @Column({ type: 'varchar', length: 64, nullable: true })
  dmKey: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  refType: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  refId: string | null;

  @Column({ type: 'bigint', nullable: true })
  lastMessageId: number | null;

  @Column({ type: 'datetime', nullable: true })
  lastMessageAt: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  lastMessagePreview: string | null;

  @OneToMany(() => ChatConversationMember, (m) => m.conversation)
  members: ChatConversationMember[];

  @OneToMany(() => ChatMessage, (m) => m.conversation)
  messages: ChatMessage[];

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;
}
