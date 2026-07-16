import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsNotEmpty,
  MaxLength,
  ArrayMinSize,
  ArrayMaxSize,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { MessageKind } from '../../enums/chat.enum';

export class CreateDmDto {
  @IsInt()
  @Type(() => Number)
  peerUserId: number;
}

export class CreateGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsInt({ each: true })
  @Type(() => Number)
  memberIds: number[];

  @IsOptional()
  @IsString()
  @MaxLength(64)
  refType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  refId?: string;
}

export class AddMembersDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @IsInt({ each: true })
  @Type(() => Number)
  memberIds: number[];
}

export class ChatAttachmentDto {
  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  mime?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsInt()
  size?: number;
}

export class SendMessageDto {
  @IsInt()
  @Type(() => Number)
  conversationId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  clientMsgId: string;

  @IsOptional()
  @IsEnum(MessageKind)
  kind?: MessageKind;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  body?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatAttachmentDto)
  attachments?: ChatAttachmentDto[];
}

export class MarkReadDto {
  @IsInt()
  @Type(() => Number)
  @Min(1)
  lastReadMessageId: number;
}

export class InboxQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class MessagesQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  beforeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class TypingDto {
  @IsInt()
  @Type(() => Number)
  conversationId: number;

  @IsOptional()
  isTyping?: boolean;
}

export class JoinConvDto {
  @IsInt()
  @Type(() => Number)
  conversationId: number;
}
