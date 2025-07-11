import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  Query,
} from '@nestjs/common';
import { RoleService } from '../services/role.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Role } from '../entities/role.entity';
import { RoleDto } from '../dtos/role.dto';
import { Feature } from '../entities/feature.entity';
import { AssignFeatureDto } from '../dtos/assign-navigator.dto';
import { AssignPermissionDto } from '../dtos/assign-permission.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { PaginationParams } from 'src/dtos/filter.dto';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('roles')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EncryptionInterceptor)
export class RoleController {
  constructor(private roleService: RoleService) {}

  @Get()
  @RequirePermission('READ', 'role')
  async getAll(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    return this.roleService.findAllWithPagination(filter);
  }

  @Get(':id')
  @RequirePermission('READ', 'role')
  async findOne(@Param('id') id: string): Promise<Role | null> {
    return this.roleService.findById(this.decode(id));
  }

  @Get('/find/:code')
  @RequirePermission('READ', 'role')
  async findByCode(@Param('code') code: string): Promise<Role | null> {
    return this.roleService.findByCode(code);
  }

  @Post()
  @RequirePermission('CREATE', 'role')
  async create(@Body() createRoleDto: RoleDto): Promise<Role> {
    return this.roleService.create(createRoleDto);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'role')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: RoleDto,
  ): Promise<Role> {
    return this.roleService.update(this.decode(id), updateRoleDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'role')
  async remove(@Param('id') id: string): Promise<void> {
    return this.roleService.remove(this.decode(id));
  }

  @Get(':id/features')
  @RequirePermission('READ', 'role')
  async getFeaturesByRole(@Param('id') id: string): Promise<Feature[]> {
    return this.roleService.getFeaturesByRole(this.decode(id));
  }

  @Post(':id/features')
  @RequirePermission('UPDATE', 'role')
  async assignFeatures(
    @Param('id') id: string,
    @Body() assignFeatureDto: AssignFeatureDto,
  ): Promise<Role> {
    return this.roleService.assignFeatures(this.decode(id), assignFeatureDto);
  }

  // Permission management endpoints
  @Get(':id/permissions')
  @RequirePermission('READ', 'role')
  async getPermissionsByRole(@Param('id') id: string) {
    return this.roleService.getPermissionsByRole(this.decode(id));
  }

  @Post(':id/permissions')
  @RequirePermission('UPDATE', 'role')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<Role> {
    return this.roleService.assignPermissions(this.decode(id), assignPermissionDto);
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
  ): Promise<Role> {
    return this.roleService.removePermissions(this.decode(id), assignPermissionDto);
  }

  @Get(':id/permissions/stats')
  async getPermissionStats(@Param('id') id: string) {
    return this.roleService.getPermissionStats(this.decode(id));
  }

  private decode(id: string) {
    const idDecode = Base64EncryptionUtil.decrypt(id);
    return parseInt(idDecode);
  }
}
