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
import { AuthorService } from '../services/author.service';
import { Author } from '../entities/author.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PaginationParams } from '../dtos/filter.dto';
import { plainToClass } from 'class-transformer';
import { CreateAuthorDto, UpdateAuthorDto, AuthorResponseDto } from '../dtos/author.dto';

@Controller('authors')
export class AuthorController {
  constructor(private readonly authorService: AuthorService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createAuthorDto: CreateAuthorDto): Promise<AuthorResponseDto> {
    const author = await this.authorService.create(createAuthorDto);
    return plainToClass(AuthorResponseDto, author);
  }

  @Get()
  async findAll(@Query() query: PaginationParams): Promise<any> {
    if (query.page || query.size || query.search) {
      return this.authorService.findPagination(query);
    }
    const authors = await this.authorService.findAll();
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('famous')
  async findFamousAuthors(): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findFamousAuthors();
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('search/:query')
  async searchAuthors(@Param('query') query: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.searchAuthors(query);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('era/:era')
  async findByEra(@Param('era') era: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findByEra(era);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('dynasty/:dynasty')
  async findByDynasty(@Param('dynasty') dynasty: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findByDynasty(dynasty);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('specialty/:specialty')
  async findBySpecialty(@Param('specialty') specialty: string): Promise<AuthorResponseDto[]> {
    const authors = await this.authorService.findBySpecialty(specialty);
    return plainToClass(AuthorResponseDto, authors);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<AuthorResponseDto> {
    const author = await this.authorService.findBySlug(slug);
    return plainToClass(AuthorResponseDto, author);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AuthorResponseDto> {
    const author = await this.authorService.findOne(+id);
    return plainToClass(AuthorResponseDto, author);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: string,
    @Body() updateAuthorDto: UpdateAuthorDto,
  ): Promise<AuthorResponseDto> {
    const author = await this.authorService.update(+id, updateAuthorDto);
    return plainToClass(AuthorResponseDto, author);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string): Promise<void> {
    await this.authorService.remove(+id);
  }

  @Post(':id/view')
  @HttpCode(HttpStatus.OK)
  async incrementViewCount(@Param('id') id: string): Promise<void> {
    await this.authorService.incrementViewCount(+id);
  }

  @Post(':id/like')
  @HttpCode(HttpStatus.OK)
  async incrementLikeCount(@Param('id') id: string): Promise<void> {
    await this.authorService.incrementLikeCount(+id);
  }
} 