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
import { Section } from './section.entity.js';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'section_id' })
  @Index('idx_items_section')
  sectionId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantity: number;

  @Column({ type: 'text', default: 'each' })
  unit: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, name: 'unit_cost' })
  unitCost: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'extended_cost' })
  extendedCost: number;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ type: 'text', default: 'ai_generated' })
  source: string;

  @Column({ type: 'jsonb', default: '{}', name: 'source_data' })
  sourceData: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Section, (s) => s.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'section_id' })
  section: Section;
}
