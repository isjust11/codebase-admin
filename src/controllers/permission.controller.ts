import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, UseInterceptors } from '@nestjs/common';
import { PermissionService } from '../services/permission.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { RequirePermission } from '../decorators/require-permissions.decorator';
import { CreatePermissionDto, UpdatePermissionDto } from '../dtos/permission.dto';
import { PaginationParams } from '../dtos/filter.dto';
import { 
  RESOURCES, 
  ACTIONS, 
  PERMISSION_TEMPLATES, 
  getAllResources, 
  getAllActions,
  getPermissionTemplate 
} from '../constants/permission.constants';
import { BaseController } from './base.controller';   

@Controller('permissions')
@UseGuards(PermissionGuard)
@UseGuards(JwtAuthGuard)
export class PermissionController extends BaseController{
  constructor(private permissionService: PermissionService) {
    super();
  }

  @Get()
  @RequirePermission('READ', 'permission')
  async findAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    return this.permissionService.findAllWithPagination(filter);
  }

  @Get('all')
  @RequirePermission('READ', 'permission')
  async getAllPermissions() {
    return this.permissionService.findAll();
  }

  @Get(':id')
  @RequirePermission('READ', 'permission')
  async findOne(@Param('id') id: string) {
    return this.permissionService.findOne(this.decode(id));
  }

  @Post()
  @RequirePermission('CREATE', 'permission')
  async create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionService.create(createPermissionDto);
  }

  @Put(':id')
  @RequirePermission('UPDATE', 'permission')
  async update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionService.update(this.decode(id), updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'permission')
  async remove(@Param('id') id: string) {
    return this.permissionService.remove(this.decode(id));
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
  async getByAction(@Param('action') action: string) {
    return this.permissionService.findByAction(action);
  }

  @Get('by-resource/:resource')
  @RequirePermission('READ', 'permission')
  async getByResource(@Param('resource') resource: string) {
    return this.permissionService.findByResource(resource);
  }

  @Get('by-action-resource/:action/:resource')
  @RequirePermission('READ', 'permission')
  async getByActionAndResource(
    @Param('action') action: string,
    @Param('resource') resource: string
  ) {
    return this.permissionService.findByActionAndResource(action, resource);
  }
} 