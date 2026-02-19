import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Estimate } from './estimate.entity.js';

@Entity('estimate_options')
export class EstimateOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'estimate_id' })
  @Index()
  estimateId: string;

  @Column({ type: 'text', nullable: true })
  tier: string | null;

  @Column({ type: 'text', nullable: true })
  label: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'boolean', default: false, name: 'is_recommended' })
  isRecommended: boolean;

  @Column({ type: 'jsonb', default: '[]', name: 'tier_details' })
  tierDetails: Record<string, unknown>[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Estimate, (estimate) => estimate.options, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimate_id' })
  estimate: Estimate;
}
