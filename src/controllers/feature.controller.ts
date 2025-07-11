import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query, Put, UseGuards } from '@nestjs/common';
import { AssignRoleDto } from '../dtos/assign-role.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { FeatureDto } from 'src/dtos/feature.dto';
import { FeatureService } from 'src/services/feature.service';
import { BaseController } from './base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('feature')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FeatureController extends BaseController{
    constructor(private readonly featureService: FeatureService) {
        super();
    }

    @Get()
    @RequirePermission('READ', 'feature')
    async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
        const filter: PaginationParams = {
            page: page || 1,
            size: size || 10,
            search: search || ''
        };
        return this.featureService.findAllWithPagination(filter);
    }
    
    @Post()
    @RequirePermission('CREATE', 'feature')
    create(@Body() createFeatureDto: FeatureDto) {
        return this.featureService.create(createFeatureDto);
    }

    @Get('all')
    @RequirePermission('READ', 'feature')
    findAll(@Query('search') search: string) {
        return this.featureService.findAll(search);
    }

    @Get(':id')
    @RequirePermission('READ', 'feature')
    findOne(@Param('id') id: string) {
        return this.featureService.findOne(this.decode(id));
    }

    @Put(':id')
    @RequirePermission('UPDATE', 'feature')
    update(@Param('id') id: string, @Body() updateFeatureDto: FeatureDto) {
        return this.featureService.update(this.decode(id), updateFeatureDto);
    }

    @Delete(':id')
    @RequirePermission('DELETE', 'feature')
    remove(@Param('id') id: string) {
        return this.featureService.remove(this.decode(id));
    }

    @Post(':id/roles')
    @RequirePermission('UPDATE', 'feature')
    assignRoles(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
        return this.featureService.assignRoles(this.decode(id), assignRoleDto);
    }

    @Delete(':id/roles')
    @RequirePermission('UPDATE', 'feature')
    removeRoles(@Param('id') id: string, @Body() roleIds: number[]) {
        return this.featureService.removeRoles(this.decode(id), roleIds);
    }

}
