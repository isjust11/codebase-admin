import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToOne } from 'typeorm';
import { Template } from './template.entity';
import { TemplateConfig } from './template-config.entity';

@Entity('template_data')
export class TemplateData {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'template_id' })
  templateId: number;

  @ManyToOne(() => Template, (template) => template.data, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_id' })
  template: Template;

  @Column({ type: 'varchar', length: 128 })
  fieldKey: string;

  @Column({ type: 'varchar', length: 32 })
  fieldType: string;

  @Column({ type: 'text', nullable: true })
  value: string;

  @OneToOne(() => TemplateConfig, (config) => config.templateData, { cascade: true })
  config: TemplateConfig;
}
