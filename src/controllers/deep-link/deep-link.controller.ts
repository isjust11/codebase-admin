import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
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

  /**
   * Apple App Site Association — iOS Universal Links verification
   * iOS fetches this at: https://readbox.pro.vn/.well-known/apple-app-site-association
   */
  @Get('.well-known/apple-app-site-association')
  appleAppSiteAssociation(@Res() res: Response) {
    const filePath = join(__dirname, '../../well-known/apple-app-site-association');
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
  }

  /**
   * Android Digital Asset Links — Android App Links verification
   * Android fetches this at: https://readbox.pro.vn/.well-known/assetlinks.json
   */
  @Get('.well-known/assetlinks.json')
  assetLinks(@Res() res: Response) {
    const filePath = join(__dirname, '../../well-known/assetlinks.json');
    const content = fs.readFileSync(filePath, 'utf8');
    res.setHeader('Content-Type', 'application/json');
    res.send(content);
  }

  /**
   * Book share redirect page
   * https://readbox.pro.vn/book/:id
   *
   * - Nếu app đã cài: Universal Link / App Link mở thẳng app
   * - Nếu chưa cài: trang HTML redirect về store
   */
  @Get('book/:id')
  async bookDeepLink(@Param('id') id: string, @Res() res: Response) {
    const appSchemeUrl = `readbox://book/${id}`;
    const iosStoreUrl = 'https://apps.apple.com/app/readbox/id000000000'; // TODO: thay App Store ID thật
    const androidStoreUrl = 'https://play.google.com/store/apps/details?id=com.hungvv.readbox'; // TODO: thay khi publish

    const html = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Mở trong Readbox</title>

  <!-- iOS App Link -->
  <meta property="al:ios:url" content="${appSchemeUrl}" />
  <meta property="al:ios:app_store_id" content="000000000" />
  <meta property="al:ios:app_name" content="Readbox" />

  <!-- Android App Link -->
  <meta property="al:android:url" content="${appSchemeUrl}" />
  <meta property="al:android:package" content="com.hungvv.readbox" />
  <meta property="al:android:app_name" content="Readbox" />

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
    .card {
      text-align: center;
      padding: 40px 32px;
      max-width: 360px;
      width: 90%;
    }
    .icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #6c63ff, #4facfe);
      border-radius: 20px;
      margin: 0 auto 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
    }
    h1 { font-size: 22px; font-weight: 700; margin-bottom: 8px; }
    p { font-size: 14px; color: rgba(255,255,255,0.65); margin-bottom: 32px; line-height: 1.6; }
    .btn {
      display: block;
      padding: 14px 24px;
      border-radius: 12px;
      font-size: 15px;
      font-weight: 600;
      text-decoration: none;
      margin-bottom: 12px;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.85; }
    .btn-primary {
      background: linear-gradient(135deg, #6c63ff, #4facfe);
      color: white;
    }
    .btn-secondary {
      background: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.2);
    }
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
    <div class="icon">📚</div>
    <h1>Mở trong Readbox</h1>
    <p>Đang thử mở ứng dụng Readbox trên thiết bị của bạn...</p>
    <div class="spinner"></div>
    <div id="status">Đang kết nối...</div>
    <a href="${appSchemeUrl}" class="btn btn-primary" id="openApp">Mở ứng dụng</a>
    <a href="${iosStoreUrl}" class="btn btn-secondary" id="downloadIos" style="display:none">Tải trên App Store</a>
    <a href="${androidStoreUrl}" class="btn btn-secondary" id="downloadAndroid" style="display:none">Tải trên Google Play</a>
  </div>

  <script>
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isAndroid = /Android/i.test(navigator.userAgent);
    const appUrl = '${appSchemeUrl}';
    const storeUrl = isIOS ? '${iosStoreUrl}' : '${androidStoreUrl}';

    if (isIOS) document.getElementById('downloadIos').style.display = 'block';
    if (isAndroid) document.getElementById('downloadAndroid').style.display = 'block';

    // Thử mở app
    window.location.href = appUrl;

    // Nếu sau 2.5s vẫn ở đây → app chưa cài → hiện nút store
    const timer = setTimeout(() => {
      document.querySelector('.spinner').style.display = 'none';
      document.getElementById('status').textContent = 'Không tìm thấy ứng dụng Readbox';
    }, 2500);

    // Nếu page bị blur (app mở thành công) → cancel timer
    window.addEventListener('blur', () => clearTimeout(timer));
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) clearTimeout(timer);
    });
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  }
}
