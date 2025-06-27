import { Controller, Get, Post, Body, Param, Put, Delete, UseInterceptors, Query } from '@nestjs/common';
import { ArticleService } from '../services/article.service';
import { ArticleDto } from '../dtos/article.dto';
import { EncryptionInterceptor } from 'src/interceptors/encryption.interceptor';
import { PaginationParams } from 'src/dtos/filter.dto';
import { Base64EncryptionUtil } from 'src/utils/base64Encryption.util';

@Controller('article')
@UseInterceptors(EncryptionInterceptor)
export class ArticleController {
  constructor(private readonly articleService: ArticleService) { }

  @Post()
  create(@Body() dto: ArticleDto) {
    return this.articleService.create(dto);
  }

  @Get()
  async getByPage(
    @Query('page') page: number,
    @Query('size') size: number,
    @Query('search') search: string,
  ) {
    const filter: PaginationParams = {
      page: page || 1,
      size: size || 10,
      search: search || '',
    };
    return this.articleService.findPagination(filter);
  }


  @Get('all')
  findAll() {
    return this.articleService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.articleService.findOne(this.decode(id));
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: ArticleDto) {
    return this.articleService.update(this.decode(id), dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.articleService.remove(this.decode(id));
  }
  private decode(id: string) {
    const idDecode = Base64EncryptionUtil.decrypt(id);
    return parseInt(idDecode);
  }
} 