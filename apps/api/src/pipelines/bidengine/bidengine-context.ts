import { ItemCategory, ItemSource, OptionTier } from './bidengine.enums.js';

export interface ScopeItem {
  description: string;
  quantity: number;
  unit: string;
  category: ItemCategory;
  pricing_hint?: string;
  labor_hours?: number;
  notes?: string;
  confidence?: 'high' | 'medium' | 'low';
}

export interface ScopeSection {
  name: string;
  labor_hours?: number;
  items: ScopeItem[];
}

export interface PricedItem {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  source: ItemSource;
  sourceData?: Record<string, unknown>;
  sectionName: string;
  sourceUrl?: string;
}

export interface OptionData {
  tier: OptionTier;
  label: string;
  description: string;
  multiplier: number;
  isRecommended: boolean;
  overrides: Record<string, unknown>;
}

export interface ProjectTotals {
  total: number;
}

export interface BidEngineContext {
  projectId: string;
  jobId?: string;
  description: string;
  address: string;
  zipCode: string;
  city: string | null;
  state: string | null;
  category: string;

  // Populated by pipeline steps
  projectType?: string;
  sections?: ScopeSection[];
  pricedItems?: PricedItem[];
  options?: OptionData[];
  totals?: ProjectTotals;
}
