export interface PipelineStep<TContext> {
  readonly name: string;
  execute(context: TContext): Promise<void>;
}
