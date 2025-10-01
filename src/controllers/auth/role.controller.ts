import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  Res,
} from '@nestjs/common';
import { RoleService } from '../../services/role.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RoleDto } from '../../dtos/role.dto';
import { AssignFeatureDto } from '../../dtos/assign-navigator.dto';
import { AssignPermissionDto } from '../../dtos/assign-permission.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { BaseController } from '../base/base.controller';
import { Response } from 'express';

@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController extends BaseController {
  constructor(private roleService: RoleService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'role')
  async getAll(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
    @Res() res: Response,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    try {
      const result = await this.roleService.findAllWithPagination(filter);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'role')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roleService.findById(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get('/find/:code')
  @RequirePermission('READ', 'role')
  async findByCode(@Param('code') code: string, @Res() res: Response) {
    try {
      const result = await this.roleService.findByCode(code);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'role')
  async create(@Body() createRoleDto: RoleDto, @Res() res: Response) {
    try {
      const result = await this.roleService.create(createRoleDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'role')
  async update(
    @Param('id') id: string,
    @Body() updateRoleDto: RoleDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.roleService.update(this.decode(id), updateRoleDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'role')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roleService.remove(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get(':id/features')
  @RequirePermission('READ', 'role')
  async getFeaturesByRole(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roleService.getFeaturesByRole(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Post(':id/features')
  @RequirePermission('UPDATE', 'role')
  async assignFeatures(
    @Param('id') id: string,
    @Body() assignFeatureDto: AssignFeatureDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.roleService.assignFeatures(this.decode(id), assignFeatureDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  // Permission management endpoints
  @Get(':id/permissions')
  @RequirePermission('READ', 'role')
  async getPermissionsByRole(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roleService.getPermissionsByRole(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Post(':id/permissions')
  @RequirePermission('UPDATE', 'role')
  async assignPermissions(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.roleService.assignPermissions(this.decode(id), assignPermissionDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Delete(':id/permissions')
  async removePermissions(
    @Param('id') id: string,
    @Body() assignPermissionDto: AssignPermissionDto,
    @Res() res: Response,
  ) {
    try {
      const result = await this.roleService.removePermissions(this.decode(id), assignPermissionDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get(':id/permissions/stats')
  async getPermissionStats(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.roleService.getPermissionStats(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }
}
