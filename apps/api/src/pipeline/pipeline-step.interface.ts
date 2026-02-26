export interface PipelineStep<TContext> {
  readonly name: string;
  execute(context: TContext): Promise<void>;
}

export type PipelineStepInput<TContext> =
  | PipelineStep<TContext>
  | PipelineStep<TContext>[];
