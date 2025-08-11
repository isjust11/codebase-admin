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
} from '@nestjs/common';
import { AuthorService } from '../../services/author.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { PaginationParams } from '../../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { AuthorDto, AuthorResponseDto } from '../../dtos/author.dto';
import { PermissionGuard } from 'src/guards/permission.guard';
import { BaseController } from '../base/base.controller';
import { RequirePermission } from 'src/decorators/require-permissions.decorator';

@Controller('authors')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class AuthorController extends BaseController {
  constructor(private readonly authorService: AuthorService) {
    super()
  }

  @Post()
  @RequirePermission('CREATE', 'author')
  async create(@Body() createAuthorDto: AuthorDto): Promise<AuthorResponseDto> {
    if (createAuthorDto.birthDate) {
      createAuthorDto.birthDate = new Date(createAuthorDto.birthDate);
    }
    if (createAuthorDto.deathDate) {
      createAuthorDto.deathDate = new Date(createAuthorDto.deathDate);
    }
    const author = await this.authorService.create(createAuthorDto);
    return plainToClass(AuthorResponseDto, author);
  }

  @Get()
  @RequirePermission('READ', 'author')
  async findAll(@Query() query: PaginationParams): Promise<any> {
    if (query.page || query.size || query.search) {
      return this.authorService.findPagination(query);
    }
    const authors = await this.authorService.findAll();
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('famous')
  @RequirePermission('READ', 'author') 
  async findFamousAuthors(): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findFamousAuthors();
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('search/:query')
  @RequirePermission('READ', 'author')
  async searchAuthors(@Param('query') query: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.searchAuthors(query);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('era/:era')
  @RequirePermission('READ', 'author')
  async findByEra(@Param('era') era: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findByEra(era);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('dynasty/:dynasty')
  @RequirePermission('READ', 'author')
  async findByDynasty(@Param('dynasty') dynasty: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findByDynasty(dynasty);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('specialty/:specialty')
  @RequirePermission('READ', 'author')
  async findBySpecialty(@Param('specialty') specialty: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findBySpecialty(specialty);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('slug/:slug')
  @RequirePermission('READ', 'author')
  async findBySlug(@Param('slug') slug: string): Promise<AuthorResponseDto> {
    const author = await this.authorService.findBySlug(slug);
    return plainToClass(AuthorResponseDto, author);
  }

  @Get(':id')
  @RequirePermission('READ', 'author')
  async findOne(@Param('id') id: string): Promise<AuthorResponseDto> {
    const author = await this.authorService.findOne(this.decode(id));
    return plainToClass(AuthorResponseDto, author);
  }

  @Patch(':id')
  @RequirePermission('UPDATE', 'author')
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: AuthorDto,
  ): Promise<AuthorResponseDto> {
    if (updateAuthorDto.birthDate) {
      updateAuthorDto.birthDate = new Date(updateAuthorDto.birthDate);
    }
    if (updateAuthorDto.deathDate) {
      updateAuthorDto.deathDate = new Date(updateAuthorDto.deathDate);
    }
    const author = await this.authorService.update(this.decode(id), updateAuthorDto);
    return plainToClass(AuthorResponseDto, author);
  }

  @Delete(':id')
  @RequirePermission('DELETE', 'author')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.authorService.remove(this.decode(id));
  }

  @Post(':id/view')
  @RequirePermission('UPDATE', 'author')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    await this.authorService.incrementViewCount(this.decode(id));
  }

  @Post(':id/like')
  @RequirePermission('UPDATE', 'author')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string): Promise<void> {
    await this.authorService.incrementLikeCount(this.decode(id));
  }
} 