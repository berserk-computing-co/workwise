import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity.js';
import { Estimate } from '../../estimates/entities/estimate.entity.js';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  phone: string | null;

  @Column({ type: 'text', nullable: true })
  email: string | null;

  @Column({ type: 'text', nullable: true })
  website: string | null;

  @Column({ type: 'text', nullable: true, name: 'license_number' })
  licenseNumber: string | null;

  // Address (flattened)
  @Column({ type: 'text', nullable: true })
  street: string | null;

  @Column({ type: 'text', nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  state: string | null;

  @Column({ type: 'text', name: 'zip_code' })
  zipCode: string;

  // Optional default markup (contractor can override per estimate)
  @Column({
    type: 'decimal',
    precision: 4,
    scale: 2,
    nullable: true,
    name: 'markup_percentage',
  })
  markupPercentage: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => Estimate, (estimate) => estimate.company)
  estimates: Estimate[];
}
