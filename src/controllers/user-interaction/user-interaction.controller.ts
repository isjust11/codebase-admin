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
  Res,
} from '@nestjs/common';
import { UserInteractionService } from '../../services/user-interaction.service';
import {
  CreateUserInteractionDto,
  UpdateUserInteractionDto,
  UserInteractionQueryDto,
} from '../../dtos/user-interaction.dto';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { UserInteraction } from 'src/entities/user-interaction.entity';
import { InteractionTarget } from 'src/enums/interaction-target.enum';
import { InteractionType } from 'src/enums/interaction-type.enum';
import { PermissionGuard } from '../../guards/permission.guard';
@Controller('user-interactions')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserInteractionController extends BaseController {
  constructor(private readonly userInteractionService: UserInteractionService) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createInteraction(
    @Request() req: any,
    @Body() createDto: CreateUserInteractionDto,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const data = await this.userInteractionService.createInteraction(userId, createDto);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }

  }

  @Put(':targetType/:targetId/:interactionType')
  async updateInteraction(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Param('interactionType') interactionType: InteractionType,
    @Body() updateDto: UpdateUserInteractionDto,
    @Res() res: Response,
  ) {
    try {
      const idInteraction = this.decode(targetId)
      const userId = req.user.id;
      const data = await this.userInteractionService.updateInteraction(
        userId,
        targetType,
        idInteraction,
        interactionType,
        updateDto,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':targetType/:targetId/:interactionType')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeInteraction(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Param('interactionType') interactionType: InteractionType,
    @Res() res: Response,
  ) {
    try {
      const targetNumber = this.decode(targetId);
      const userId = req.user.id;
      await this.userInteractionService.removeInteraction(
        userId,
        targetType,
        targetNumber,
        interactionType,
      );
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('my-interactions')
  async getMyInteractions(
    @Request() req: any,
    @Query() query: UserInteractionQueryDto,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const data = await this.userInteractionService.getUserInteractions(userId, query);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('stats/:targetType/:targetId')
  async getInteractionStats(
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const targetIdNum = this.decode(targetId);
      const data = await this.userInteractionService.getInteractionStats(targetType, targetIdNum);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('view/:targetType/:targetId')
  async view(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.VIEW,
        targetType: targetType as InteractionTarget,
        targetId: targetIdNumber,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // Convenience endpoints for common interactions
  @Post('like/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async like(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetNumber = this.decode(targetId)
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.LIKE,
        targetType: targetType as InteractionTarget,
        targetId: targetNumber,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }

  }

  @Post('bookmark/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async bookmark(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.BOOKMARK,
        targetType: targetType as InteractionTarget,
        targetId: targetIdNumber,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('share/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async share(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Body() body: { sharePlatform?: string },
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.SHARE,
        targetType: targetType as InteractionTarget,
        targetId: targetIdNumber,
        sharePlatform: body.sharePlatform,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }

  }

  @Post('rating/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async rating(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Body() body: { rating: number, comment?: string },
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.RATING,
        targetType: targetType as InteractionTarget,
        targetId: targetIdNumber,
        rating: body.rating,
        comment: body.comment,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('load-interaction/:targetType/:targetId')
  async loadInteraction(
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Query() query: UserInteractionQueryDto,
    @Res() res: Response,
  ) {
    try {
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.loadInteraction(targetType, targetIdNumber, query);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('follow/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @Request() req: any,
    @Param('targetType') targetType: string,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.FOLLOW,
        targetType: targetType as InteractionTarget,
        targetId: targetIdNumber,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }

  }
  // interaction common for all targets
  @Post('action/:actionType/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async action(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('actionType') actionType: InteractionType,
    @Param('targetId') targetId: string,
    @Body() body: { metadata?: any },
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: actionType,
        targetType: targetType,
        targetId: targetIdNumber,
        metadata: body.metadata,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('action/:actionType/:targetType/:targetId')
  async getInteractionAction(
    @Param('targetType') targetType: InteractionTarget,
    @Param('actionType') actionType: InteractionType,
    @Param('targetId') targetId: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.getInteractionAction(targetType, actionType, targetIdNumber, userId);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('unlike/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unlike(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('interactionType') interactionType: InteractionType,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.removeInteraction(
        userId,
        targetType as InteractionTarget,
        targetIdNumber,
        interactionType as InteractionType,
      );
      return this.success(res, new UserInteraction(
      ));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('unbookmark/:targetType/:targetId')
  async unbookmark(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('interactionType') interactionType: InteractionType,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.removeInteraction(
        userId,
        targetType,
        targetIdNumber,
        interactionType,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('unfollow/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unfollow(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('interactionType') interactionType: InteractionType,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.removeInteraction(
        userId,
        targetType,
        targetIdNumber,
        interactionType,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
