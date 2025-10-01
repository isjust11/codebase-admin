import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Res } from '@nestjs/common';
import { PermissionService } from '../../services/permission.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PermissionGuard } from '../../guards/permission.guard';
import { RequirePermission } from '../../decorators/require-permissions.decorator';
import { CreatePermissionDto, UpdatePermissionDto } from '../../dtos/permission.dto';
import { PaginationParams } from '../../dtos/filter.dto';
import { Response } from 'express';
import { 
  RESOURCES, 
  ACTIONS, 
  PERMISSION_TEMPLATES, 
  getAllResources, 
  getAllActions,
  getPermissionTemplate 
} from '../../constants/permission.constants';
import { BaseController } from '../base/base.controller';   

@Controller('permissions')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class PermissionController extends BaseController{
  constructor(private permissionService: PermissionService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'permission')
  async findAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    try {
      const result = await this.permissionService.findAllWithPagination(filter);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get('all')
  @RequirePermission('READ', 'permission')
  async getAllPermissions(@Res() res: Response) {
    try {
      const result = await this.permissionService.findAll();
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'permission')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.permissionService.findOne(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'permission')
  async create(@Body() createPermissionDto: CreatePermissionDto, @Res() res: Response) {
    try {
      const result = await this.permissionService.create(createPermissionDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'permission')
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto, @Res() res: Response) {
    try {
      const result = await this.permissionService.update(this.decode(id), updatePermissionDto);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'permission')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.permissionService.remove(this.decode(id));
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  // API mới để frontend lấy thông tin resources và actions
  @Get('constants/resources')
  @RequirePermission('READ', 'permission')
  async getResources() {
    return {
      resources: RESOURCES,
      allResources: getAllResources(),
    };
  }

  @Get('constants/actions')
  @RequirePermission('READ', 'permission')
  async getActions() {
    return {
      actions: ACTIONS,
      allActions: getAllActions(),
    };
  }

  @Get('constants/templates')
  @RequirePermission('READ', 'permission')
  async getPermissionTemplates() {
    return {
      templates: PERMISSION_TEMPLATES,
    };
  }

  @Get('constants/templates/:resource')
  @RequirePermission('READ', 'permission')
  async getPermissionTemplateByResource(@Param('resource') resource: string) {
    const template = getPermissionTemplate(resource);
    if (!template) {
      return { error: 'Resource not found' };
    }
    return { template };
  }

  // API để tạo permission từ template
  @Post('create-from-template')
  @RequirePermission('CREATE', 'permission')
  async createFromTemplate(@Body() body: { resource: string; selectedActions: string[] }) {
    const { resource, selectedActions } = body;
    const template = getPermissionTemplate(resource);
    
    if (!template) {
      throw new Error('Resource template not found');
    }

    const createdPermissions: any[] = [];
    
    for (const action of selectedActions) {
      const permissionData = template.permissions.find(p => p.action === action);
      if (permissionData) {
        const createDto: CreatePermissionDto = {
          name: permissionData.name,
          code: permissionData.code,
          action: action,
          resource: resource,
          description: `Quyền ${permissionData.name.toLowerCase()}`,
          isActive: true,
        };
        
        const created = await this.permissionService.create(createDto);
        createdPermissions.push(created);
      }
    }

    return createdPermissions;
  }

  // API để lấy permission theo action và resource
  @Get('by-action/:action')
  @RequirePermission('READ', 'permission')
  async getByAction(@Param('action') action: string, @Res() res: Response) {
    try {
      const result = await this.permissionService.findByAction(action);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get('by-resource/:resource')
  @RequirePermission('READ', 'permission')
  async getByResource(@Param('resource') resource: string, @Res() res: Response) {
    try {
      const result = await this.permissionService.findByResource(resource);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get('by-action-resource/:action/:resource')
  @RequirePermission('READ', 'permission')
  async getByActionAndResource(
    @Param('action') action: string,
    @Param('resource') resource: string
  , @Res() res: Response) {
    try {
      const result = await this.permissionService.findByActionAndResource(action, resource);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }

  @Get('has-permission')
  @RequirePermission('READ', 'permission')
  async hasPermission(@Query('permission') permission: string, @Res() res: Response) {
    try {
      const result = await this.permissionService.hasPermissionByCode(permission);
      return this.success(res, result);
    } catch (error) {
      this.error(res, error);
    }
  }
} 