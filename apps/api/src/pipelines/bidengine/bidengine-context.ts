export interface ScopeItem {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  category: "material" | "labor" | "equipment" | "permit" | "other";
  pricing_hint?: string;
  labor_hours?: number;
  notes?: string;
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
  source:
    | "ai_decomposition"
    | "ai_priced"
    | "ai_unmatched"
    | "manual"
    | "template";
  sourceData?: Record<string, unknown>;
  sectionName: string;
}

export interface OptionData {
  tier: "good" | "better" | "best";
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
  sections?: ScopeSection[];
  pricedItems?: PricedItem[];
  options?: OptionData[];
  totals?: ProjectTotals;
}
