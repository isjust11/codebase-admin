import { Controller, Post, Get, UseGuards, HttpCode, Param, Res, NotFoundException, Logger } from '@nestjs/common';
import { Response } from 'express';
import { GoogleDriveSyncService } from 'src/services/google-drive-sync.service';
import { GoogleDriveService } from 'src/services/google-drive.service';
import { JwtAuthGuard, Public } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('google-drive')
export class GoogleDriveSyncController {
  private readonly logger = new Logger(GoogleDriveSyncController.name);

  constructor(
    private readonly googleDriveSyncService: GoogleDriveSyncService,
    private readonly googleDriveService: GoogleDriveService,
  ) { }

  /**
   * POST /google-drive/sync
   * Kích hoạt sync thủ công ngay lập tức
   */
  @Post('sync')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('CREATE', 'media')
  @HttpCode(200)
  async triggerSync() {
    const result = await this.googleDriveSyncService.syncFromDrive({ force: true });
    return {
      message: 'Sync completed',
      ...result,
    };
  }

  /**
   * POST /google-drive/sync-missing-info
   * Kích hoạt đồng bộ các thông tin còn thiếu (coverImageUrl, language...)
   */
  @Post('sync-missing-info')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('UPDATE', 'book')
  @HttpCode(200)
  async triggerSyncMissingInfo() {
    const result = await this.googleDriveSyncService.syncMissingBookInfo(50); // limit 50 books per call
    return {
      message: 'Sync missing info completed',
      ...result,
    };
  }

  /**
   * GET /google-drive/status
   * Lấy trạng thái sync hiện tại
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('READ', 'media')
  async getStatus() {
    return this.googleDriveSyncService.getStatus();
  }

  /**
   * GET /google-drive/download/:fileId
   * Proxy tải file từ Google Drive qua Service Account
   * Không cần auth user — Flutter app dùng SfPdfViewer.network() không gửi auth header
   */
  @Public()
  @Get('download/:fileId')
  async downloadFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    try {
      if (!this.googleDriveService.isConfigured()) {
        throw new NotFoundException('Google Drive not configured');
      }

      // Lấy metadata để set đúng Content-Type và filename
      const metadata = await this.googleDriveService.getFileMetadata(fileId);
      if (!metadata) {
        throw new NotFoundException(`File not found: ${fileId}`);
      }

      // Tải file dưới dạng Stream để tránh tràn RAM và giảm độ trễ
      const stream = await this.googleDriveService.downloadFileStream(fileId);

      const name = metadata.name?.toLowerCase() ?? '';
      let contentType = metadata.mimeType || 'application/octet-stream';
      if (name.endsWith('.epub')) {
        contentType = 'application/epub+zip';
      } else if (name.endsWith('.pdf')) {
        contentType = 'application/pdf';
      }

      res.set({
        'Content-Type': contentType,
        'Content-Length': metadata.size, // Lấy size từ metadata
        'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.name)}"`,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      });

      // Pipe dữ liệu thẳng xuống client
      stream.pipe(res);
    } catch (error) {
      this.logger.error(`[Download] Failed to proxy file ${fileId}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Unable to download file: ${fileId}`);
    }
  }
}
