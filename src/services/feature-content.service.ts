import { Injectable, NotFoundException } from '@nestjs/common';
import { getMessages, SupportedLocale } from 'src/constants/messages';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeatureContent } from '../entities/feature-content.entity';
import { FeatureContentDto } from '../dtos/feature-content.dto';

@Injectable()
export class FeatureContentService {
  constructor(
    @InjectRepository(FeatureContent)
    private featureContentRepository: Repository<FeatureContent>,
  ) {}

  async create(dto: FeatureContentDto): Promise<FeatureContent> {
    const entity = this.featureContentRepository.create(dto);
    return this.featureContentRepository.save(entity);
  }

  async findAll(): Promise<FeatureContent[]> {
    return this.featureContentRepository.find();
  }

  async findOne(id: number, locale: SupportedLocale = 'vi'): Promise<FeatureContent> {
    const entity = await this.featureContentRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException(getMessages(locale).featureContent.notFound);
    return entity;
  }
 
  async update(id: number, dto: FeatureContentDto, locale: SupportedLocale = 'vi'): Promise<FeatureContent> {
    const entity = await this.findOne(id, locale);
    Object.assign(entity, dto);
    return this.featureContentRepository.save(entity);
  }

  async remove(id: number, locale: SupportedLocale = 'vi'): Promise<void> {
    const result = await this.featureContentRepository.delete(id);
    if (result.affected === 0) throw new NotFoundException(getMessages(locale).featureContent.notFound);
  }
} 