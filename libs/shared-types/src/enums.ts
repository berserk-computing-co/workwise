/** Project lifecycle status. */
export enum ProjectStatus {
  Draft = "draft",
  Generating = "generating",
  Cancelled = "cancelled",
  Review = "review",
  Sent = "sent",
  Accepted = "accepted",
  Rejected = "rejected",
}

/** Status of a PipelineJob record in the database. */
export enum JobStatus {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
  Cancelled = "cancelled",
}

/** Status emitted via SSE for individual step progress. */
export enum StepStatus {
  Running = "running",
  Complete = "complete",
  Error = "error",
}

/** What kind of entity the pipeline job targets. */
export enum TargetType {
  Project = "project",
}

/** Which pipeline produced this job. */
export enum PipelineType {
  BidEngine = "bidengine",
}

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
