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
import { Organization } from '../../users/entities/organization.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { Section } from './section.entity.js';
import { Option } from './option.entity.js';

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'organization_id' })
  @Index('idx_projects_org')
  organizationId: string;

  @Column({ type: 'uuid', name: 'created_by' })
  createdBy: string;

  @Column({ type: 'text', default: 'draft' })
  status: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', default: 'plumbing' })
  category: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ type: 'text', name: 'zip_code' })
  zipCode: string;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  state: string | null;

  @Column({ type: 'text', nullable: true, name: 'client_name' })
  clientName: string | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'jsonb', default: '{}' })
  metadata: Record<string, unknown>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ type: 'timestamptz', nullable: true, name: 'deleted_at' })
  deletedAt: Date | null;

  @ManyToOne(() => Organization, (org) => org.projects)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator: User;

  @OneToMany(() => Section, (s) => s.project)
  sections: Section[];

  @OneToMany(() => Option, (o) => o.project)
  options: Option[];
}
