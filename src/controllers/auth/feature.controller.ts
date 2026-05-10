import { Controller, Get, Post, Body, Param, Delete, Query, Put, UseGuards, Res } from '@nestjs/common';
import { AssignRoleDto } from '../../dtos/assign-role.dto';
import { PaginationParams } from 'src/dtos/filter.dto';
import { FeatureDto } from 'src/dtos/feature.dto';
import { FeatureService } from 'src/services/feature.service';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { PermissionGuard } from 'src/guards/permission.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Response } from 'express';
import { Locale } from 'src/decorators/locale.decorator';
import { SupportedLocale } from 'src/constants/messages';

@Controller('feature')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class FeatureController extends BaseController {
    constructor(private readonly featureService: FeatureService) {
        super();
    }

    @Get()
    @RequirePermission('READ', 'feature')
    async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
        const filter: PaginationParams = {
            page: page || 1,
            size: size || 10,
            search: search || ''
        };
        try {
            const result = await this.featureService.findAllWithPagination(filter);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }
    @Post()
    @RequirePermission('CREATE', 'feature')
    async create(@Body() createFeatureDto: FeatureDto, @Res() res: Response) {
        try {
            const result = await this.featureService.create(createFeatureDto);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Get('all')
    @RequirePermission('READ', 'feature')
    async findAll(@Query('search') search: string, @Res() res: Response) {
        try {
            const result = await this.featureService.findAll(search);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Get(':id')
    @RequirePermission('READ', 'feature')
    async findOne(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
        try {
            const result = await this.featureService.findOne(this.decode(id), locale);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Put(':id')
    @RequirePermission('UPDATE', 'feature')
    async update(@Param('id') id: string, @Body() updateFeatureDto: FeatureDto, @Locale() locale: SupportedLocale, @Res() res: Response) {
        try {
            const result = await this.featureService.update(this.decode(id), updateFeatureDto, locale);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Delete(':id')
    @RequirePermission('DELETE', 'feature')
    async remove(@Param('id') id: string, @Locale() locale: SupportedLocale, @Res() res: Response) {
        try {
            const result = await this.featureService.remove(this.decode(id), locale);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Post(':id/roles')
    @RequirePermission('UPDATE', 'feature')
    async assignRoles(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto, @Locale() locale: SupportedLocale, @Res() res: Response) {
        try {
            const result = await this.featureService.assignRoles(this.decode(id), assignRoleDto, locale);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

    @Delete(':id/roles')
    @RequirePermission('UPDATE', 'feature')
    async removeRoles(@Param('id') id: string, @Body() roleIds: number[], @Locale() locale: SupportedLocale, @Res() res: Response) {
        try {
            const result = await this.featureService.removeRoles(this.decode(id), roleIds, locale);
            return this.success(res, result);
        } catch (error) {
            this.error(res, error);
        }
    }

}
