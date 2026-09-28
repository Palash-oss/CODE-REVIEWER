import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('ai_provider_configs')
export class AiProviderConfigEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  providerType: 'openai' | 'lm-studio' | 'ollama' | 'gemini' | 'generic';

  @Column()
  baseUrl: string;

  @Column({ nullable: true })
  apiKey: string;

  @Column()
  model: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: string;
}