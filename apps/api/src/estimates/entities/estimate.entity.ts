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

  @Column({ type: 'text', name: 'job_site_address' })
  jobSiteAddress: string;

  // Project input
  @Column({ type: 'text', name: 'project_description' })
  projectDescription: string;

  @Column({ type: 'text', nullable: true, name: 'project_type' })
  projectType: string | null;

  @Column({ type: 'text', default: 'plumbing', name: 'trade_category' })
  tradeCategory: string;

  @Column({ type: 'text', nullable: true, name: 'property_type' })
  propertyType: string | null;

  @Column({ type: 'text', name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  state: string | null;

  // Totals
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'material_subtotal' })
  materialSubtotal: number;

  @Column({ type: 'decimal', precision: 8, scale: 2, default: 0, name: 'labor_hours' })
  laborHours: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'labor_subtotal' })
  laborSubtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'overhead_amount' })
  overheadAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'profit_amount' })
  profitAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0, name: 'tax_amount' })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  // Per-estimate rates (tax based on ZIP)
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'tax_rate',
  })
  taxRate: number | null;

  // Property enrichment
  @Column({ type: 'int', nullable: true, name: 'property_year_built' })
  propertyYearBuilt: number | null;

  @Column({ type: 'int', nullable: true, name: 'property_sqft' })
  propertySqft: number | null;

  @Column({ type: 'int', nullable: true, name: 'property_bedrooms' })
  propertyBedrooms: number | null;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true, name: 'property_bathrooms' })
  propertyBathrooms: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true, name: 'property_valuation' })
  propertyValuation: number | null;

  @Column({ type: 'jsonb', nullable: true, name: 'property_data_json' })
  propertyDataJson: Record<string, unknown> | null;

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
