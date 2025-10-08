import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserInteractionService } from '../../services/user-interaction.service';
import {
  CreateUserInteractionDto,
  UpdateUserInteractionDto,
  UserInteractionQueryDto,
} from '../../dtos/user-interaction.dto';
import { InteractionType } from '../../enums/interaction-type.enum';
import { InteractionTarget } from '../../enums/interaction-target.enum';

import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('user-interactions')
@UseGuards(JwtAuthGuard)
export class UserInteractionController {
  constructor(private readonly userInteractionService: UserInteractionService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInteraction(
    @Request() req: any,
    @Body() createDto: CreateUserInteractionDto,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, createDto);
  }

  @Put(':targetType/:targetId/:interactionType')
  async updateInteraction(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
    @Param('interactionType') interactionType: InteractionType,
    @Body() updateDto: UpdateUserInteractionDto,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.updateInteraction(
      userId,
      targetType,
      targetId,
      interactionType,
      updateDto,
    );
  }

  @Delete(':targetType/:targetId/:interactionType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeInteraction(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
    @Param('interactionType') interactionType: InteractionType,
  ) {
    const userId = req.user.id;
    await this.userInteractionService.removeInteraction(
      userId,
      targetType,
      targetId,
      interactionType,
    );
  }

  @Get('my-interactions')
  async getMyInteractions(
    @Request() req: any,
    @Query() query: UserInteractionQueryDto,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.getUserInteractions(userId, query);
  }

  @Get('stats/:targetType/:targetId')
  async getInteractionStats(
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    return await this.userInteractionService.getInteractionStats(targetType, targetId);
  }

  @Get('status/:targetType/:targetId')
  async getInteractionStatus(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.getUserInteractionStatus(
      userId,
      targetType,
      targetId,
    );
  }

  // Convenience endpoints for common interactions
  @Post('like/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async like(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, {
      interactionType: InteractionType.LIKE,
      targetType,
      targetId,
    });
  }

  @Post('bookmark/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async bookmark(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, {
      interactionType: InteractionType.BOOKMARK,
      targetType,
      targetId,
    });
  }

  @Post('share/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async share(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
    @Body() body: { sharePlatform?: string },
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, {
      interactionType: InteractionType.SHARE,
      targetType,
      targetId,
      sharePlatform: body.sharePlatform,
    });
  }

  @Post('rate/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async rate(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
    @Body() body: { rating: number },
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, {
      interactionType: InteractionType.RATE,
      targetType,
      targetId,
      rating: body.rating,
    });
  }

  @Post('follow/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    return await this.userInteractionService.createInteraction(userId, {
      interactionType: InteractionType.FOLLOW,
      targetType,
      targetId,
    });
  }

  @Delete('unlike/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    await this.userInteractionService.removeInteraction(
      userId,
      targetType,
      targetId,
      InteractionType.LIKE,
    );
  }

  @Delete('unbookmark/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unbookmark(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    await this.userInteractionService.removeInteraction(
      userId,
      targetType,
      targetId,
      InteractionType.BOOKMARK,
    );
  }

  @Delete('unfollow/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: number,
  ) {
    const userId = req.user.id;
    await this.userInteractionService.removeInteraction(
      userId,
      targetType,
      targetId,
      InteractionType.FOLLOW,
    );
  }
}
