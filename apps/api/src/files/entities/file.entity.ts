import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Project } from '../../projects/entities/project.entity.js';

@Entity('files')
export class File {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index('idx_files_project')
  projectId: string;

  @Column({ type: 'text', name: 's3_key' })
  s3Key: string;

  @Column({ type: 'text', name: 'file_name' })
  fileName: string;

  @Column({ type: 'text', name: 'content_type' })
  contentType: string;

  @Column({ type: 'bigint', name: 'size_bytes' })
  sizeBytes: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Project)
  @JoinColumn({ name: 'project_id' })
  project: Project;
}
