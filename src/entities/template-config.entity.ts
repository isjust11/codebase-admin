import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { TemplateData } from './template-data.entity';

@Entity('template_config')
export class TemplateConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'template_data_id' })
  templateDataId: number;

  @OneToOne(() => TemplateData, (templateData) => templateData.config, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'template_data_id' })
  templateData: TemplateData;

  @Column({ type: 'varchar', length: 32, nullable: true })
  display: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  color: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  font: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  size: string;
}
