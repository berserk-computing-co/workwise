/** Category for a scope line item. */
export enum ItemCategory {
  Material = "material",
  Labor = "labor",
  Equipment = "equipment",
  Permit = "permit",
  Other = "other",
}

/** How a priced item's cost was sourced. */
export enum ItemSource {
  AiDecomposition = "ai_decomposition",
  AiPriced = "ai_priced",
  AiUnmatched = "ai_unmatched",
  WebPriced = "web_priced",
  Manual = "manual",
  Template = "template",
}

/** Good/better/best option tiers. */
export enum OptionTier {
  Good = "good",
  Better = "better",
  Best = "best",
}
