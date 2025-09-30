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
import { AuthorService } from '../../services/author.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { AuthorDto } from '../../dtos/author.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';
import { Response } from 'express';
@Controller('authors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuthorController extends BaseController {
  constructor(private readonly authorService: AuthorService) {
    super()
  }

  @Post()
  @RequirePermission('CREATE', 'author')
  async create(@Body() createAuthorDto: AuthorDto, @Res() res: Response) {
    try {
      if (createAuthorDto.birthDate) {
        createAuthorDto.birthDate = new Date(createAuthorDto.birthDate);
      }
      if (createAuthorDto.deathDate) {
        createAuthorDto.deathDate = new Date(createAuthorDto.deathDate);
      }
      const author = await this.authorService.create(createAuthorDto);
      return this.success(res, author);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get()
  @RequirePermission('READ', 'author')
  async findAll(@Query() query: PaginationParams, @Res() res: Response) {
    try {
    if (query.page || query.size || query.search) {
      const authors = await this.authorService.findPagination(query);
      return this.success(res, authors);
    }
    const authors = await this.authorService.findAll();
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('famous')
  @RequirePermission('READ', 'author')
  async findFamousAuthors(@Res() res: Response) {
    try {
    const authors = await this.authorService.findFamousAuthors();
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('search/:query')
  @RequirePermission('READ', 'author')
  async searchAuthors(@Param('query') query: string, @Res() res: Response) {
    try {
    const authors = await this.authorService.searchAuthors(query);
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('era/:era')
  @RequirePermission('READ', 'author')
  async findByEra(@Param('era') era: string, @Res() res: Response) {
    try {
    const authors = await this.authorService.findByEra(era);
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('dynasty/:dynasty')
  @RequirePermission('READ', 'author')
    async findByDynasty(@Param('dynasty') dynasty: string, @Res() res: Response) {
    try {
    const authors = await this.authorService.findByDynasty(dynasty);
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('specialty/:specialty')
  @RequirePermission('READ', 'author')
  async findBySpecialty(@Param('specialty') specialty: string, @Res() res: Response) {
    try {
    const authors = await this.authorService.findBySpecialty(specialty);
      return this.success(res, authors);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get('slug/:slug')
  @RequirePermission('READ', 'author')
  async findBySlug(@Param('slug') slug: string, @Res() res: Response) {
    try {
    const author = await this.authorService.findBySlug(slug);
      return this.success(res, author);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Get(':id')
  @RequirePermission('READ', 'author')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
    const author = await this.authorService.findOne(this.decode(id));
      return this.success(res, author);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'author')
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: AuthorDto,
    @Res() res: Response,
  ) {
    try {
    if (updateAuthorDto.birthDate) {
      updateAuthorDto.birthDate = new Date(updateAuthorDto.birthDate);
    }
    if (updateAuthorDto.deathDate) {
      updateAuthorDto.deathDate = new Date(updateAuthorDto.deathDate);
    }
    const author = await this.authorService.update(this.decode(id), updateAuthorDto);
      return this.success(res, author);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'author')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
    await this.authorService.remove(this.decode(id));
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/view')
  @RequirePermission('UPDATE', 'author')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string, @Res() res: Response) {
    try {
    await this.authorService.incrementViewCount(this.decode(id));
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }

  @Post(':id/like')
  @RequirePermission('UPDATE', 'author')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string, @Res() res: Response) {
    try {
    await this.authorService.incrementLikeCount(this.decode(id));
      return this.success(res, null);
    } catch (error) {
      return this.error(res, error);
    }
  }
} 