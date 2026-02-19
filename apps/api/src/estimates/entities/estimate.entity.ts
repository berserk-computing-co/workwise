import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Company } from '../../users/entities/company.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { EstimateSection } from './estimate-section.entity.js';
import { EstimateOption } from './estimate-option.entity.js';

@Entity('estimates')
export class Estimate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'company_id' })
  @Index()
  companyId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'text', default: 'draft' })
  @Index()
  status: string;

  // Customer info
  @Column({ type: 'text', nullable: true, name: 'customer_name' })
  customerName: string | null;

  @Column({ type: 'text', nullable: true, name: 'customer_email' })
  customerEmail: string | null;

  @Column({ type: 'text', nullable: true, name: 'customer_phone' })
  customerPhone: string | null;

  @Column({ type: 'text', nullable: true, name: 'customer_address' })
  customerAddress: string | null;

  // Project input
  @Column({ type: 'text', name: 'project_description' })
  projectDescription: string;

  @Column({ type: 'text', nullable: true, name: 'project_type' })
  projectType: string | null;

  @Column({ type: 'text', name: 'zip_code' })
  zipCode: string;

  // Totals
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  // Per-estimate rates (markup copied from company default, tax based on ZIP)
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'markup_percentage',
  })
  markupPercentage: number | null;

  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'tax_rate',
  })
  taxRate: number | null;

  // Notes
  @Column({ type: 'text', nullable: true, name: 'internal_notes' })
  internalNotes: string | null;

  @Column({ type: 'text', nullable: true, name: 'customer_notes' })
  customerNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  // Relations
  @ManyToOne(() => Company, (company) => company.estimates)
  @JoinColumn({ name: 'company_id' })
  company: Company;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => EstimateSection, (section) => section.estimate)
  sections: EstimateSection[];

  @OneToMany(() => EstimateOption, (option) => option.estimate)
  options: EstimateOption[];
}
