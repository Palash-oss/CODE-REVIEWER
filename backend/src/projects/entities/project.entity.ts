import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  owner: User;

  @Column()
  ownerId: string;

  @CreateDateColumn()
  createdAt: Date;
}