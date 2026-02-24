export interface CompanyRates {
  hourlyRate: number;
  burdenMultiplier: number;
  overheadMultiplier: number;
  profitMargin: number;
  taxRate: number;
}

export interface ScopeItem {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
}

export interface ScopeSection {
  name: string;
  laborHours: number;
  items: ScopeItem[];
}

export interface PricedLineItem {
  description: string;
  quantity: number;
  unit: string;
  unitCost: number;
  source: 'onebuild' | 'ai_generated' | 'manual';
  onebuildSourceId?: string;
  onebuildMatchScore?: number;
  flagged: boolean;
  flagReason?: string;
  sectionName: string;
}

export interface EstimateOptionData {
  tier: 'good' | 'better' | 'best';
  label: string;
  description: string;
  total: number;
  isRecommended: boolean;
  tierDetails: { change: string; costDelta: number }[];
}

export interface EstimateTotals {
  materialSubtotal: number;
  laborHours: number;
  laborSubtotal: number;
  overheadAmount: number;
  profitAmount: number;
  taxAmount: number;
  total: number;
}

export interface GenerationContext {
  estimateId: string;
  projectDescription: string;
  jobSiteAddress: string;
  zipCode: string;
  tradeCategory: string;
  propertyType: string | null;
  companyRates: CompanyRates;

  // Populated by pipeline steps
  projectType?: string;
  sections?: ScopeSection[];
  pricedItems?: PricedLineItem[];
  options?: EstimateOptionData[];
  totals?: EstimateTotals;
}
