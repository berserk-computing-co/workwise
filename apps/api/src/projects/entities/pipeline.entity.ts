import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  VersionColumn,
} from 'typeorm';
import { Project } from './project.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'project_id' })
  @Index('idx_pipelines_project')
  projectId: string;

  @Column({ type: 'uuid', name: 'triggered_by' })
  triggeredBy: string;

  @Column({ type: 'text', default: 'pending' })
  @Index('idx_pipelines_status')
  status: string;

  @Column({ type: 'text', nullable: true, name: 'current_step' })
  currentStep: string | null;

  @Column({ type: 'jsonb', default: '[]' })
  steps: Record<string, unknown>[];

  @Column({ type: 'jsonb', nullable: true })
  errors: Record<string, unknown> | null;

  @Column({ type: 'int', default: 0, name: 'total_input_tokens' })
  totalInputTokens: number;

  @Column({ type: 'int', default: 0, name: 'total_output_tokens' })
  totalOutputTokens: number;

  @Column({ type: 'int', default: 0, name: 'estimated_cost_cents' })
  estimatedCostCents: number;

  @Column({ type: 'int', nullable: true, name: 'duration_ms' })
  durationMs: number | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'started_at' })
  startedAt: Date | null;

  @Column({ type: 'timestamptz', nullable: true, name: 'completed_at' })
  completedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'triggered_by' })
  triggerer: User;
}
