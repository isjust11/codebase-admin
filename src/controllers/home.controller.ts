import { Controller, Get, Param, Res } from '@nestjs/common';
import { Public } from '../guards/jwt-auth.guard';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';
import { BaseController } from './base/base.controller';

@Controller()
export class HomeController extends BaseController {
  constructor() {
    super();
  }

  @Public()
  @Get()
  async getHome(@Res() res: Response) {
    const filePath = path.join(__dirname, '..', '..', 'public', 'pages', 'home.html');
    if (!fs.existsSync(filePath)) {
      return res.status(404).send('Home page not found');
    }
    return res.sendFile(filePath);
  }
}
