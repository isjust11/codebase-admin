import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { FcmService } from '../../services/fcm.service';
import { FcmTokenService } from '../../services/fcm-token.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';

@Controller('fcm')
@UseGuards(JwtAuthGuard)
export class FcmController {
  constructor(
    private readonly fcmService: FcmService,
    private readonly fcmTokenService: FcmTokenService,
  ) {}

  @Post('register-token')
  @RequirePermission('CREATE', 'fcm')
  async registerToken(
    @Body() body: { 
      token: string; 
      platform: string; 
      app_version: string;
      deviceId?: string;
    },
    @Request() req,
  ) {
    const userId = req.user?.id;
    // Lưu FCM token vào database với userId
    await this.fcmTokenService.registerOrUpdate( {
      token: body.token,
      platform: body.platform,
      deviceId: body.deviceId,
      app_version: body.app_version,
    }, userId);
    
    console.log('FCM Token registered:', {
      token: body.token,
      platform: body.platform,
      app_version: body.app_version,
      timestamp: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: 'FCM token registered successfully' 
    };
  }

  @Post('subscribe-topic')
  @RequirePermission('CREATE', 'fcm')
  async subscribeToTopic(@Body() body: { topic: string }) {
    // TODO: Store topic subscription in database
    console.log('Topic subscription:', {
      topic: body.topic,
      timestamp: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: `Subscribed to topic: ${body.topic}` 
    };
  }

  @Post('unsubscribe-topic')
  @RequirePermission('CREATE', 'fcm')
  async unsubscribeFromTopic(@Body() body: { topic: string }) {
    // TODO: Remove topic subscription from database
    console.log('Topic unsubscription:', {
      topic: body.topic,
      timestamp: new Date().toISOString(),
    });
    
    return { 
      success: true, 
      message: `Unsubscribed from topic: ${body.topic}` 
    };
  }

  @Post('send-to-token')
  @RequirePermission('CREATE', 'fcm')
  async sendToToken(@Body() body: { 
    token: string; 
    title: string; 
    body: string; 
    data?: Record<string, string> 
  }) {
    const result = await this.fcmService.sendToToken(body.token, {
      title: body.title,
      body: body.body,
      data: body.data,
    });
    
    return { 
      success: true, 
      messageId: result,
      message: 'Message sent successfully' 
    };
  }

  @Post('send-to-tokens')
  @RequirePermission('CREATE', 'fcm')
  async sendToTokens(@Body() body: { 
    tokens: string[]; 
    title: string; 
    body: string; 
    data?: Record<string, string> 
  }) {
    const result = await this.fcmService.sendToTokens(body.tokens, {
      title: body.title,
      body: body.body,
      data: body.data,
    });
    
    return { 
      success: true, 
      ...result,
      message: 'Messages sent successfully' 
    };
  }

  @Post('send-to-topic')
  @RequirePermission('CREATE', 'fcm')
  async sendToTopic(@Body() body: { 
    topic: string; 
    title: string; 
    body: string; 
    data?: Record<string, string> 
  }) {
    const result = await this.fcmService.sendToTopic(body.topic, {
      title: body.title,
      body: body.body,
      data: body.data,
    });
    
    return { 
      success: true, 
      messageId: result,
      message: 'Message sent to topic successfully' 
    };
  }
}
