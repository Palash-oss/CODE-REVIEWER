import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Project } from '../../projects/entities/project.entity';

@Entity('files')
export class FileEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  path: string; // relative path e.g. "src/index.ts"

  @Column()
  name: string; // "index.ts"

  @Column({ default: 'file' })
  type: 'file' | 'folder';

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;

  @Column()
  projectId: string;
}