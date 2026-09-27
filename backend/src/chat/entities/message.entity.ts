import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { ChatSession } from './chat-session.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  role: 'user' | 'assistant';

  @Column({ type: 'text' })
  content: string;

  @ManyToOne(() => ChatSession, { onDelete: 'CASCADE' })
  session: ChatSession;

  @Column()
  sessionId: string;

  @CreateDateColumn()
  createdAt: Date;
}