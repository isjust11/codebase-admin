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
   * GET /google-drive/status
   * Lấy trạng thái sync hiện tại
   */
  @Get('status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @RequirePermission('READ', 'media')
  getStatus() {
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

      // Download file content qua Service Account
      const buffer = await this.googleDriveService.downloadFileBuffer(fileId);

      res.set({
        'Content-Type': metadata.mimeType,
        'Content-Length': buffer.length,
        'Content-Disposition': `inline; filename="${encodeURIComponent(metadata.name)}"`,
        'Cache-Control': 'public, max-age=86400', // Cache 24h
      });

      res.send(buffer);
    } catch (error) {
      this.logger.error(`[Download] Failed to proxy file ${fileId}: ${error.message}`);
      if (error instanceof NotFoundException) throw error;
      throw new NotFoundException(`Unable to download file: ${fileId}`);
    }
  }
}
