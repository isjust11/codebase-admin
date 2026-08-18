import { Controller, Get, Param, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import * as fs from 'fs';
import { Public } from 'src/guards/jwt-auth.guard';
import { BaseController } from '../base/base.controller';

@Controller()
@Public()
export class DeepLinkController extends BaseController {
  constructor() {
    super();
  }

  private publicBaseUrl(): string {
    return (process.env.PUBLIC_INVITE_BASE_URL || process.env.WEB_URL || process.env.CLIENT_URL || 'http://localhost:3200').replace(/\/$/, '');
  }

  private appScheme(): string {
    return process.env.APP_SCHEME || 'eventlab';
  }

  @Get('.well-known/apple-app-site-association')
  appleAppSiteAssociation(@Res() res: Response) {
    const filePath = join(__dirname, '../../well-known/apple-app-site-association');
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
  }

  @Get('.well-known/assetlinks.json')
  assetLinks(@Res() res: Response) {
    const filePath = join(__dirname, '../../well-known/assetlinks.json');
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
  }

  private isDesktopUserAgent(userAgent?: string): boolean {
    if (!userAgent) return true;
    return !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
      userAgent,
    );
  }

  /**
   * Public invitation deep link: /e/:token
   * Desktop → web invite page; mobile → app scheme or store fallback.
   */
  @Get('e/:token')
  async inviteDeepLink(@Param('token') token: string, @Res() res: Response, @Req() req: Request) {
    const webInviteUrl = `${this.publicBaseUrl()}/e/${token}`;
    const userAgent = req.headers['user-agent'];

    if (this.isDesktopUserAgent(userAgent)) {
      return res.redirect(302, webInviteUrl);
    }

    const language = req.headers['custom-language']?.includes('vi-VN') ? 'vi' : 'en';
    const appSchemeUrl = `${this.appScheme()}://invite/${token}`;
    const iosStoreUrl = process.env.IOS_STORE_URL || 'https://apps.apple.com/app/eventlab';
    const androidStoreUrl = process.env.ANDROID_STORE_URL || 'https://play.google.com/store/apps/details?id=com.eventlab.app';

    const texts = language === 'vi' ? {
      title: 'Mở trong EventLab',
      desc: 'Đang thử mở ứng dụng EventLab trên thiết bị của bạn...',
      statusInit: 'Đang kết nối...',
      statusFail: 'Không tìm thấy ứng dụng EventLab',
      btnOpen: 'Mở ứng dụng',
      btnIos: 'Tải trên App Store',
      btnAndroid: 'Tải trên Google Play',
    } : {
      title: 'Open in EventLab',
      desc: 'Trying to open the EventLab application on your device...',
      statusInit: 'Connecting...',
      statusFail: 'EventLab application not found',
      btnOpen: 'Open App',
      btnIos: 'Download on App Store',
      btnAndroid: 'Download on Google Play',
    };

    const html = `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${texts.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
    }
    .card { text-align: center; padding: 40px 32px; max-width: 360px; width: 90%; }
    .icon {
      width: 80px; height: 80px;
      background: linear-gradient(135deg, #6c63ff, #4facfe);
      border-radius: 20px;
      margin: 0 auto 24px;
      display: flex; align-items: center; justify-content: center;
      font-size: 36px;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: rgba(255,255,255,0.65); margin-bottom: 32px; line-height: 1.6; }
    .btn {
      display: block; padding: 14px 24px; border-radius: 12px;
      font-size: 15px; font-weight: 600; text-decoration: none;
      margin-bottom: 12px;
    }
    .btn-primary { background: linear-gradient(135deg, #6c63ff, #4facfe); color: white; }
    .btn-secondary { background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.2); }
    .spinner {
      width: 24px; height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #status { font-size: 13px; color: rgba(255,255,255,0.5); margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">🎉</div>
    <h1>${texts.title}</h1>
    <p>${texts.desc}</p>
    <div class="spinner"></div>
    <div id="status">${texts.statusInit}</div>
    <a href="${appSchemeUrl}" class="btn btn-primary" id="openApp">${texts.btnOpen}</a>
    <a href="${iosStoreUrl}" class="btn btn-secondary" id="downloadIos" style="display:none">${texts.btnIos}</a>
    <a href="${androidStoreUrl}" class="btn btn-secondary" id="downloadAndroid" style="display:none">${texts.btnAndroid}</a>
  </div>
  <script>
    const isDesktop = !/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(navigator.userAgent);
    if (isDesktop) window.location.replace('${webInviteUrl}');
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const appUrl = '${appSchemeUrl}';
    if (isIOS) document.getElementById('downloadIos').style.display = 'block';
    if (isAndroid) document.getElementById('downloadAndroid').style.display = 'block';
    window.location.href = appUrl;
    const timer = setTimeout(() => {
      document.querySelector('.spinner').style.display = 'none';
      document.getElementById('status').textContent = '${texts.statusFail}';
    }, 2500);
    window.addEventListener('blur', () => clearTimeout(timer));
    document.addEventListener('visibilitychange', () => { if (document.hidden) clearTimeout(timer); });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
