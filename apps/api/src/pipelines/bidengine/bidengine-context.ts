import { ItemCategory, ItemSource, OptionTier } from "./bidengine.enums.js";

export interface ScopeItem {
  description: string;
  quantity: number;
  unit: string;
  category: ItemCategory;
  pricing_hint?: string;
  labor_hours?: number;
  notes?: string;
  confidence?: "high" | "medium" | "low";
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
}

export interface OptionData {
  tier: OptionTier;
  label: string;
  description: string;
  total: number;
  isRecommended: boolean;
  overrides: Record<string, unknown>;
}

export interface ProjectTotals {
  total: number;
}

export interface BidEngineContext {
  projectId: string;
  description: string;
  address: string;
  zipCode: string;
  category: string;

  // Populated by pipeline steps
  projectType?: string;
  sections?: ScopeSection[];
  oneBuildResults?: PricedItem[];
  webResults?: PricedItem[];
  pricedItems?: PricedItem[];
  options?: OptionData[];
  totals?: ProjectTotals;
}
