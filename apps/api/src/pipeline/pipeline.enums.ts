/** Status of a PipelineJob record in the database. */
export enum JobStatus {
  Pending = "pending",
  Running = "running",
  Completed = "completed",
  Failed = "failed",
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
