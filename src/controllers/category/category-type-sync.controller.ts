import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { CategoryTypeSyncService } from '../../services/category-type-sync.service';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('category-type-sync')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class CategoryTypeSyncController {
  constructor(private readonly categoryTypeSyncService: CategoryTypeSyncService) {}

  @Post('sync-all')
  @RequirePermission('CREATE', 'category-type')
  async syncAllFromEnum() {
    const result = await this.categoryTypeSyncService.syncFromEnum();
    return {
      message: 'Đồng bộ CategoryType thành công',
      data: result
    };
  }

  @Get('unsynced')
  @RequirePermission('READ', 'category-type')
  async getUnsyncedEnumValues() {
    const unsyncedValues = await this.categoryTypeSyncService.getUnsyncedEnumValues();
    return {
      message: 'Danh sách enum values chưa được đồng bộ',
      data: unsyncedValues,
      count: unsyncedValues.length
    };
  }

  @Post('sync/:enumValue')
  @RequirePermission('CREATE', 'category-type')
  async syncSingleFromEnum(enumValue: string) {
    const result = await this.categoryTypeSyncService.syncSingleFromEnum(enumValue);
    return {
      message: `Đồng bộ CategoryType cho enum: ${enumValue}`,
      data: result
    };
  }
} 