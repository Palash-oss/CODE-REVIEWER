import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('reviews')
export class Review {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  templateType: 'security' | 'performance' | 'code-quality';

  @Column({ type: 'jsonb' })
  targetFiles: string[]; // file IDs reviewed

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb' })
  issues: {
    file: string;
    line?: number;
    message: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }[];

  @Column({ type: 'jsonb' })
  recommendations: string[];

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: string;

  @CreateDateColumn()
  createdAt: Date;
}