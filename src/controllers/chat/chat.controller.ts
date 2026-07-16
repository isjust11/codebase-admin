import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { ChatService } from '../../services/chat/chat.service';
import { ChatGateway } from '../../gateways/chat.gateway';
import {
  AddMembersDto,
  CreateDmDto,
  CreateGroupDto,
  MarkReadDto,
  SendMessageDto,
} from '../../dtos/chat/chat.dto';
import { CHAT_APP_ID_HEADER } from '../../constants/chat.constants';

@ApiTags('chat')
@ApiBearerAuth()
@ApiHeader({ name: CHAT_APP_ID_HEADER, required: false })
@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  private userId(req: any): number {
    return req.user?.id ?? req.user?.sub;
  }

  private appId(headers: Record<string, string | string[] | undefined>): string {
    return this.chatService.resolveAppId(headers[CHAT_APP_ID_HEADER]);
  }

  @Get('conversations')
  async inbox(
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listInbox(
      this.userId(req),
      this.appId(headers),
      cursor,
      limit ? Number(limit) : 30,
    );
  }

  @Post('conversations/dm')
  async createDm(
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: CreateDmDto,
  ) {
    const conv = await this.chatService.getOrCreateDm(
      this.userId(req),
      dto,
      this.appId(headers),
    );
    return { conversation: conv };
  }

  @Post('conversations/group')
  async createGroup(
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
    @Body() dto: CreateGroupDto,
  ) {
    const conv = await this.chatService.createGroup(
      this.userId(req),
      dto,
      this.appId(headers),
    );
    return { conversation: conv };
  }

  @Post('conversations/:id/members')
  async addMembers(
    @Req() req: any,
    @Headers() headers: Record<string, string | undefined>,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddMembersDto,
  ) {
    const members = await this.chatService.addMembers(
      id,
      this.userId(req),
      dto,
      this.appId(headers),
    );
    return { members };
  }

  @Get('conversations/:id/messages')
  async messages(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Query('beforeId') beforeId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.listMessages(
      id,
      this.userId(req),
      beforeId ? Number(beforeId) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Post('conversations/:id/messages')
  async sendViaRest(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Omit<SendMessageDto, 'conversationId'>,
  ) {
    const result = await this.chatService.sendMessage(this.userId(req), {
      ...body,
      conversationId: id,
    });
    if (result.created) {
      await this.chatGateway.emitMessageNew(
        result.message,
        id,
        result.memberUserIds,
      );
    }
    return { message: result.message, created: result.created };
  }

  @Patch('conversations/:id/read')
  async markRead(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: MarkReadDto,
  ) {
    const result = await this.chatService.markRead(id, this.userId(req), dto);
    await this.chatGateway.emitReadUpdate(result);
    return result;
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Req() req: any,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const message = await this.chatService.softDeleteMessage(id, this.userId(req));
    await this.chatGateway.emitMessageNew(
      message,
      message.conversationId,
      await this.chatService.getMemberUserIds(message.conversationId),
    );
    return { message };
  }
}
