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
import { LineItem } from './line-item.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('line_item_edits')
export class LineItemEdit {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'estimate_id' })
  @Index()
  estimateId: string;

  @Column({ type: 'uuid', nullable: true, name: 'line_item_id' })
  lineItemId: string | null;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'text', name: 'edit_type' })
  editType: string;

  @Column({ type: 'jsonb', nullable: true, name: 'previous_value' })
  previousValue: Record<string, unknown> | null;

  @Column({ type: 'jsonb', nullable: true, name: 'new_value' })
  newValue: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true, name: 'section_name' })
  sectionName: string | null;

  @Column({ type: 'text', nullable: true, name: 'project_type' })
  projectType: string | null;

  @Column({ type: 'text', nullable: true, name: 'zip_code' })
  zipCode: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => Estimate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'estimate_id' })
  estimate: Estimate;

  @ManyToOne(() => LineItem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'line_item_id' })
  lineItem: LineItem | null;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
