import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../guards/jwt-auth.guard';

@Controller()
export class AppAdsController {
  @Public()
  @Get('app-ads.txt')
  getAppAds(@Res() res: Response) {
    res.type('text/plain').send('google.com, pub-3618888231032837, DIRECT, f08c47fec0942fa0\n');
  }
}
