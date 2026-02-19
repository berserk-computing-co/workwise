import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EstimateSection } from './estimate-section.entity.js';

@Entity('line_items')
export class LineItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'section_id' })
  @Index()
  sectionId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'text', default: 'each' })
  unit: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    name: 'unit_cost',
  })
  unitCost: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    default: 0,
    name: 'extended_cost',
  })
  extendedCost: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  // Source tracking
  @Column({ type: 'text', default: 'ai_generated' })
  source: string;

  @Column({ type: 'text', nullable: true, name: 'onebuild_source_id' })
  onebuildSourceId: string | null;

  @Column({ type: 'real', nullable: true, name: 'onebuild_match_score' })
  onebuildMatchScore: number | null;

  // Flags
  @Column({ type: 'boolean', default: false })
  flagged: boolean;

  @Column({ type: 'text', nullable: true, name: 'flag_reason' })
  flagReason: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_optional' })
  isOptional: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => EstimateSection, (section) => section.lineItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'section_id' })
  section: EstimateSection;
}
