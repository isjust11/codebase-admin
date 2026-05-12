import { Controller, Post, Get, UseGuards, HttpCode } from '@nestjs/common';
import { GoogleDriveSyncService } from 'src/services/google-drive-sync.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { PermissionGuard } from 'src/guards/permission.guard';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('google-drive')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class GoogleDriveSyncController {
  constructor(private readonly googleDriveSyncService: GoogleDriveSyncService) {}

  /**
   * POST /google-drive/sync
   * Kích hoạt sync thủ công ngay lập tức
   */
  @Post('sync')
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
  @RequirePermission('READ', 'media')
  getStatus() {
    return this.googleDriveSyncService.getStatus();
  }
}
