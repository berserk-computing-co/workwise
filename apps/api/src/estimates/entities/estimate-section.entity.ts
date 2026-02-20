import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Estimate } from './estimate.entity.js';
import { LineItem } from './line-item.entity.js';

@Entity('estimate_sections')
export class EstimateSection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'estimate_id' })
  @Index()
  estimateId: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'labor_hours' })
  laborHours: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Estimate, (estimate) => estimate.sections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimate_id' })
  estimate: Estimate;

  @OneToMany(() => LineItem, (item) => item.section)
  lineItems: LineItem[];
}
