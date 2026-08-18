import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Template } from '../entities/template.entity';
import { TemplateService } from '../services/template.service';
import { TemplateRenderService } from '../services/template-render.service';
import { TemplateSectionCompilerService } from '../services/template-section-compiler.service';
import { TemplateController } from '../controllers/template/template.controller';
import { PublicTemplateController } from '../controllers/template/public-template.controller';
import { AuthModule } from './auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Template])],
  providers: [TemplateService, TemplateRenderService, TemplateSectionCompilerService],
  controllers: [TemplateController, PublicTemplateController],
  exports: [TemplateService, TemplateRenderService, TemplateSectionCompilerService],
})
export class TemplateModule {}
