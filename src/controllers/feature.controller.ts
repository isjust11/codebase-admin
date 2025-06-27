import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, Query, Put } from '@nestjs/common';
import { AssignRoleDto } from '../dtos/assign-role.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';
import { FeatureDto } from 'src/dtos/feature.dto';
import { FeatureService } from 'src/services/feature.service';

@Controller('feature')
@UseInterceptors(EncryptionInterceptor)
export class FeatureController {
    constructor(private readonly featureService: FeatureService) {}
    @Get()
    async getAll(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string) {
        const filter: PaginationParams = {
            page: page || 1,
            size: size || 10,
            search: search || ''
        };
        return this.featureService.findAllWithPagination(filter);
    }
    
    @Post()
    create(@Body() createFeatureDto: FeatureDto) {
        return this.featureService.create(createFeatureDto);
    }

    @Get('all')
    findAll() {
        return this.featureService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.featureService.findOne(this.decode(id));
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() updateFeatureDto: FeatureDto) {
        return this.featureService.update(this.decode(id), updateFeatureDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.featureService.remove(this.decode(id));
    }

    @Post(':id/roles')
    assignRoles(@Param('id') id: string, @Body() assignRoleDto: AssignRoleDto) {
        return this.featureService.assignRoles(this.decode(id), assignRoleDto);
    }

    @Delete(':id/roles')
    removeRoles(@Param('id') id: string, @Body() roleIds: number[]) {
        return this.featureService.removeRoles(this.decode(id), roleIds);
    }

    // @Get(':id/roles')
    // getNavigatorRoles(@Param('id') id: string) {
    //     return this.featureService.getNavigatorRoles(this.decode(id));
    // }

    private decode(id:string){
        const idDecode = Base64EncryptionUtil.decrypt(id);
        return parseInt(idDecode);
      }
}
