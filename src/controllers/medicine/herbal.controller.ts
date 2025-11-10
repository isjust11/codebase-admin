import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { HerbalService } from '../../services/herbal.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { CreateHerbalDto, UpdateHerbalDto } from '../../dtos/herbal.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { Response } from 'express';
@Controller('herbals')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class HerbalController extends BaseController {
  constructor(private readonly herbalService: HerbalService) {
    super()
  }

  @Get()
  @RequirePermission('READ', 'herbal')
  async findByPage(@Query('page') page: number, @Query('size') size: number, @Query('search') search: string, @Res() res: Response) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || ''
    };
    try {
      const data = await this.herbalService.findPagination(filter);
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  // get all 
  @Get('all')
  @RequirePermission('READ','herbal')
  async findAll(@Res() res: Response) {
    try {
      const data = await this.herbalService.getAll();
      return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post()
  @RequirePermission('CREATE', 'herbal')
  async create(@Body() createHerbalDto: CreateHerbalDto, @Res() res: Response) {
    try {
    const data = await this.herbalService.create({ ...createHerbalDto, 
      authorId: createHerbalDto.authorId ? this.decode(createHerbalDto.authorId.toString()) : undefined });
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('category/:categoryId')
  @RequirePermission('READ', 'herbal')
  async findByCategory(@Param('categoryId') categoryId: string, @Res() res: Response) {
    try {
      const herbals = await this.herbalService.findByCategory(this.decode(categoryId.toString()));
    return this.success(res, herbals);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('scientific-name/:scientificName')
  @RequirePermission('READ', 'herbal')
  async findByScientificName(@Param('scientificName') scientificName: string, @Res() res: Response) {
    try {
    const herbals = await this.herbalService.findByScientificName(scientificName);
    return this.success(res, herbals);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('family/:family')
  @RequirePermission('READ', 'herbal')
  async findByFamily(@Param('family') family: string, @Res() res: Response) {
    try {
    const herbals = await this.herbalService.findByFamily(family);
    return this.success(res, herbals);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'herbal')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
    const herbal = await this.herbalService.findOne(this.decode(id));
    return this.success(res, herbal);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'herbal')
  async update(
    @Param('id') id: string,
    @Body() updateHerbalDto: UpdateHerbalDto,
    @Res() res: Response,
  ) {
    try {
    const herbal = await this.herbalService.update(this.decode(id), 
    { ...updateHerbalDto, authorId: updateHerbalDto.authorId ? this.decode(updateHerbalDto.authorId.toString()) : undefined });
    return this.success(res, herbal);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'herbal')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
    const data = await this.herbalService.remove(this.decode(id));
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/view')
  @RequirePermission('UPDATE', 'herbal')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string, @Res() res: Response) {
    try {
    const data = await this.herbalService.incrementViewCount(this.decode(id));
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/like')
  @RequirePermission('UPDATE', 'herbal')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string, @Res() res: Response) {
    try {
    const data = await this.herbalService.incrementLikeCount(this.decode(id));
    return this.success(res, data);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 