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
import { InteractionType } from '../../enums/interaction-type.enum';
import { InteractionTarget } from '../../enums/interaction-target.enum';
import { Response } from 'express';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';
import { UserInteraction } from 'src/entities/user-interaction.entity';

@Controller('user-interactions')
@UseGuards(JwtAuthGuard)
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

  @Get('status/:targetType/:targetId')
  async getInteractionStatus(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetNumber = this.decode(targetId);
      const data = await this.userInteractionService.getUserInteractionStatus(
        userId,
        targetType,
        targetNumber,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('view/:targetType/:targetId')
  async view(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.VIEW,
        targetType, 
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
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetNumber = this.decode(targetId)
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.LIKE,
        targetType,
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
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.BOOKMARK,
        targetType,
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
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Body() body: { sharePlatform?: string },
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.SHARE,
        targetType,
        targetId: targetIdNumber,
        sharePlatform: body.sharePlatform,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }

  }

  @Post('rate/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async rate(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Body() body: { rating: number },
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.RATE,
        targetType,
        targetId: targetIdNumber,
        rating: body.rating,
      });
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('follow/:targetType/:targetId')
  @HttpCode(HttpStatus.CREATED)
  async follow(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
    @Param('targetId') targetId: string,
    @Res() res: Response,
  ) {
    try {
      const userId = req.user.id;
      const targetIdNumber = this.decode(targetId);
      const data = await this.userInteractionService.createInteraction(userId, {
        interactionType: InteractionType.FOLLOW,
        targetType,
        targetId: targetIdNumber,
      });
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
        InteractionType.LIKE,
      );
      return this.success(res, new UserInteraction(
      ));
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete('unbookmark/:targetType/:targetId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unbookmark(
    @Request() req: any,
    @Param('targetType') targetType: InteractionTarget,
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
        InteractionType.BOOKMARK,
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
        InteractionType.FOLLOW,
      );
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
}
