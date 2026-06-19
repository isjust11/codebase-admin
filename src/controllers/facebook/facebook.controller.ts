import { Controller, Post, HttpCode } from '@nestjs/common';
import { FacebookAutoPostService } from '../../services/jobs/facebook-auto-post.service';

@Controller('facebook')
export class FacebookController {
  constructor(
    private readonly autoPostService: FacebookAutoPostService,
  ) { }

  @Post('auto-post')
  @HttpCode(200)
  async testAutoPost() {
    await this.autoPostService.handleCron();
    return {
      success: true,
      message: 'Đã gọi thử nghiệm job đăng Facebook. Vui lòng kiểm tra console log hệ thống hoặc truy cập Fanpage để xem.',
    };
  }
}
