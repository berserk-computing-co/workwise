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
} from "typeorm";
import { User } from "../../users/entities/user.entity.js";
import { JobStatus, TargetType, PipelineType } from "../pipeline.enums.js";

@Entity("jobs")
export class PipelineJob {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", name: "target_id" })
  @Index("idx_jobs_target")
  targetId: string;

  @Column({ type: "text", name: "target_type", default: TargetType.Project })
  @Index("idx_jobs_target_type")
  targetType: TargetType;

  @Column({ type: "text", name: "pipeline_type" })
  @Index("idx_jobs_pipeline_type")
  pipelineType: PipelineType;

  @Column({ type: "uuid", name: "triggered_by" })
  triggeredBy: string;

  @Column({ type: "text", default: JobStatus.Pending })
  @Index("idx_jobs_status")
  status: JobStatus;

  @Column({ type: "text", nullable: true, name: "current_step" })
  currentStep: string | null;

  @Column({ type: "jsonb", default: "[]" })
  steps: Record<string, unknown>[];

  @Column({ type: "jsonb", nullable: true })
  errors: Record<string, unknown> | null;

  @Column({ type: "int", default: 0, name: "total_input_tokens" })
  totalInputTokens: number;

  @Column({ type: "int", default: 0, name: "total_output_tokens" })
  totalOutputTokens: number;

  @Column({ type: "int", default: 0, name: "estimated_cost_cents" })
  estimatedCostCents: number;

  @Column({ type: "int", nullable: true, name: "duration_ms" })
  durationMs: number | null;

  @Column({ type: "timestamptz", nullable: true, name: "started_at" })
  startedAt: Date | null;

  @Column({ type: "timestamptz", nullable: true, name: "completed_at" })
  completedAt: Date | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @VersionColumn()
  version: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "triggered_by" })
  triggerer: User;
}
