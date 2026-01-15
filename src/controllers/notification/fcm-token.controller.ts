import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, HttpCode, HttpStatus, Res, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { FcmTokenService } from '../../services/fcm-token.service';
import { Response } from 'express';
import { FcmTokenDto } from '../../dtos/fcm-token.dto';
import { TopicSubscriptionService } from 'src/services/topic-subscription.service';
import { FcmService } from 'src/services/fcm.service';
@Controller('fcm-tokens')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FcmTokenController extends BaseController {
  constructor(private readonly service: FcmTokenService,
    private readonly fcmService: FcmService,
    private readonly topicSubscriptionService: TopicSubscriptionService,
  ) { super(); }

  @Get()
  @RequirePermission('READ', 'fcm_token')
  async findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    try {
      const result = await this.service.findPagination(page || 1, size || 10, search || '');
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('register')
  @RequirePermission('CREATE', 'fcm_token')
  async register(@Body() body: FcmTokenDto,@Res() res: Response, @Req() req) { 
    try {
      const userId = req.user?.id;
      const result = await this.service.registerOrUpdate({
        token: body.token,
        platform: body.platform,
        deviceId: body.deviceId,
      }, userId);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post('batch-register')
  @RequirePermission('CREATE', 'fcm_token')
  async batchRegister(@Body() body: FcmTokenDto[], @Res() res: Response, @Req() req) {
    try {
      const userId = req.user?.id;
      const result = await this.service.registerMany(body, userId);
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('user/:userId')
  @RequirePermission('READ', 'fcm_token')
  async findByUser(@Param('userId') userId: string, @Res() res: Response) {
    try {
      const result = await this.service.findByUserId(this.decode(userId));
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'fcm_token')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.service.findById(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Post('subscribe-topic')
  @RequirePermission('CREATE', 'fcm_token')
  async subscribeTopic(@Body() body: { topic: string }, @Res() res: Response, @Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.service.subscribeTopic(body.topic, userId);
      const subscription = await this.topicSubscriptionService.subscribe(userId, body.topic);
      return this.success(res, {
        success: true,
        message: `Successfully subscribed to topic: ${body.topic}`,
        data: {
          ...result,
          topicSubscription: subscription,
        },
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Post('unsubscribe-topic')
  @RequirePermission('CREATE', 'fcm_token')
  async unsubscribeTopic(@Body() body: { topic: string }, @Res() res: Response, @Req() req: any) {
    try {
      const userId = req.user?.id;
      const result = await this.service.unsubscribeTopic(body.topic, userId);
      const subscription = await this.topicSubscriptionService.unsubscribe(userId, body.topic);
      return this.success(res, {
        success: true,
        message: `Successfully unsubscribed from topic: ${body.topic}`,
        data: {
          ...result,
          topicSubscription: subscription,
        },
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Patch(':id/deactivate')
  @RequirePermission('UPDATE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string, @Res() res: Response, @Req() req: any) {
    try {
      const userId = req.user?.id;
      await this.service.deactivate(this.decode(id));
      return this.success(res, {
        success: true,
        message: `Successfully deactivated FCM token: ${id}`,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
  @Delete(':id')
  @RequirePermission('DELETE', 'fcm_token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response, @Req() req: any) {
    try {
      const userId = req.user?.id;
      await this.service.remove(this.decode(id));
      return this.success(res, {
        success: true,
        message: `Successfully removed FCM token: ${id}`,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
   /**
   * Get topics current user is subscribed to
   * @route GET /topic-subscriptions/my-topics
   */
   @Get('my-topics')
   async getMyTopics(@Req() req: any, @Res() res: Response) {
     try {
       const userId = req.user.id;
       const topics = await this.topicSubscriptionService.getTopicsByUserId(userId);
       return this.success(res, {
         success: true,
         data: topics,
         count: topics.length,
       });
     } catch (error) {
       return this.error(res, error);
     }
   }
 
   /**
    * Check if current user is subscribed to a topic
    * @route GET /topic-subscriptions/check/:topic
    */
   @Get('check/:topic')
   async checkSubscription(
     @Res() res: Response,
     @Req() req: any,
     @Param('topic') topic: string,
   ) {
     try {
       const userId = req.user.id;
       const isSubscribed = await this.topicSubscriptionService.isSubscribed(userId, topic);
       return this.success(res, {
         success: true,
         data: {
           topic,
           isSubscribed,
         },
       });
     } catch (error) {
       return this.error(res, error);
     }
   }
 
  /**
   * Get available topics to subscribe
   * @route GET /fcm-tokens/available-topics
   */
  @Get('available-topics')
  async getAvailableTopics(@Res() res: Response) {
    try {
      // Get active topics from database
      const topics = await this.topicSubscriptionService.findAll();
      
      return this.success(res, {
        success: true,
        data: topics,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
 
   /**
    * Batch subscribe to multiple topics
    * @route POST /topic-subscriptions/batch-subscribe
    */
   @Post('batch-subscribe')
   @HttpCode(HttpStatus.OK)
   async batchSubscribe(
     @Res() res: Response,
     @Req() req: any,
     @Body() body: { topics: string[] },
   ) {
     try {
     const userId = req.user.id;
     const { topics } = body;
 
     const results = await Promise.all(
       topics.map(async (topic) => {
         try {
           await this.service.subscribeTopic(topic, userId);
           await this.topicSubscriptionService.subscribe(userId, topic);
           return { topic, success: true };
         } catch (error) {
           return { topic, success: false, error: error.message };
         }
       })
     );
 
     const successCount = results.filter(r => r.success).length;
 
     return this.success(res, {
       success: true,
       message: `Subscribed to ${successCount}/${topics.length} topics`,
       data: results,
       });
     } catch (error) {
       return this.error(res, error);
     }
   }
 
   /**
    * Admin: Get topic statistics
    * @route GET /topic-subscriptions/admin/stats/:topic
    */
   @Get('admin/stats/:topic')
   @RequirePermission('READ', 'notification')
   async getTopicStats(@Param('topic') topic: string, @Res() res: Response) {
     try {
       const stats = await this.topicSubscriptionService.getTopicStats(topic);
     return this.success(res, {
       success: true,
         data: stats,
       });
     } catch (error) {
       return this.error(res, error);
       }
     }
 
  /**
   * Admin: Get all stats for all topics
   * @route GET /fcm-tokens/admin/stats
   */
  @Get('admin/stats')
  @RequirePermission('READ', 'notification')
  async getAllTopicsStats(@Res() res: Response) {
    try {
      // Get all topic subscriptions
      const subscriptions = await this.topicSubscriptionService.findAll();
      
      // Get unique topics
      const uniqueTopics = [...new Set(subscriptions.map(sub => sub.topic))];
      
      // Get stats for each topic
      const stats = await Promise.all(
        uniqueTopics.map(topic => this.topicSubscriptionService.getTopicStats(topic))
      );
      
      return this.success(res, {
        success: true,
        data: stats,
      });
    } catch (error) {
      return this.error(res, error);
    }
  }
 
   /**
    * Admin: Get subscribers for a topic
    * @route GET /topic-subscriptions/admin/subscribers/:topic
    */
   @Get('admin/subscribers/:topic')
   @RequirePermission('READ', 'notification')
   async getTopicSubscribers(
     @Res() res: Response,
     @Param('topic') topic: string,
     @Query('page') page: number = 1,
     @Query('size') size: number = 20,
   ) {
     const userIds = await this.topicSubscriptionService.getUserIdsByTopic(topic);
     try {
     // Pagination
     const startIndex = (page - 1) * size;
     const endIndex = startIndex + size;
     const paginatedUserIds = userIds.slice(startIndex, endIndex);
 
     return this.success(res, {
       success: true,
       data: {
         topic,
         userIds: paginatedUserIds,
         pagination: {
           page,
           size,
           total: userIds.length,
           totalPages: Math.ceil(userIds.length / size),
         },
       },
     });
     } catch (error) {
       return this.error(res, error);
     }
   }
 
   /**
    * Admin: Force subscribe a user to a topic
    * @route POST /topic-subscriptions/admin/force-subscribe
    */
   @Post('admin/force-subscribe')
   @RequirePermission('CREATE', 'notification')
   @HttpCode(HttpStatus.OK)
   async forceSubscribe(
     @Res() res: Response,
     @Body() body: { userId: number; topic: string },
   ) {
     try {
       const { userId, topic } = body;
 
     await this.service.subscribeTopic(topic, userId);
     const subscription = await this.topicSubscriptionService.subscribe(userId, topic);
 
     return this.success(res, {
       success: true,
       message: `Force subscribed user ${userId} to topic: ${topic}`,
       data: subscription,
     });
     } catch (error) {
       return this.error(res, error);
     }
   }
 
   /**
    * Admin: Force unsubscribe a user from a topic
    * @route POST /topic-subscriptions/admin/force-unsubscribe
    */
   @Post('admin/force-unsubscribe')
   @RequirePermission('DELETE', 'notification')
   @HttpCode(HttpStatus.OK)
   async forceUnsubscribe(
     @Res() res: Response,
     @Body() body: { userId: number; topic: string },
   ) {
     try {
       const { userId, topic } = body;
 
     await this.service.unsubscribeTopic(topic, userId);
     await this.topicSubscriptionService.unsubscribe(userId, topic);
 
     return this.success(res, {
       success: true,
       message: `Force unsubscribed user ${userId} from topic: ${topic}`,
     });
     } catch (error) {
       return this.error(res, error);
     }
   }

   @Post('fcm/send-token')
  @RequirePermission('CREATE', 'notification')
  async sendFcmToToken(@Body() body: { token: string; title: string; body: string; data?: Record<string, string> }) {
    const result = await this.fcmService.sendToToken(body.token, { title: body.title, body: body.body, data: body.data, type: 'system' });
    return { success: true, messageId: result };
  }

  @Post('fcm/send-tokens')
  @RequirePermission('CREATE', 'notification')
  async sendFcmToTokens(@Body() body: { tokens: string[]; title: string; body: string; data?: Record<string, string> }) {
    const result = await this.fcmService.sendToTokens(body.tokens, { title: body.title, body: body.body, data: body.data, type: 'system' });
    return { success: true, ...result };
  }

  @Post('fcm/send-topic')
  @RequirePermission('CREATE', 'notification')
  async sendFcmToTopic(@Body() body: { topic: string; title: string; body: string; data?: Record<string, string> }) {
    try {
      const result = await this.fcmService.sendToTopic(body.topic, { title: body.title, body: body.body, data: body.data, type: 'system' });
      return { success: true, messageId: result };
    } catch (error) {
      return { success: false, message: 'Error sending FCM to topic', error: error.message };
      }
    }
}



