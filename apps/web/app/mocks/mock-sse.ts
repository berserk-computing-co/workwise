/**
 * SSE event generator that simulates the 6-step BidEngine pipeline.
 */

interface MockSSEOptions {
  /** Total duration in ms for the full pipeline (default: 10000) */
  duration?: number;
  /** If true, simulate a failure at step 4 */
  simulateError?: boolean;
}

interface SSEEvent {
  event: string;
  data: string;
}

const PIPELINE_STEPS = [
  {
    step: 'scope_decomposition',
    message: 'Breaking down project scope into work items...',
  },
  {
    step: 'onebuild_pricing',
    message: 'Fetching material prices from 1Build...',
  },
  {
    step: 'web_pricing',
    message: 'Searching web for additional pricing data...',
  },
  {
    step: 'price_merge',
    message: 'Merging and reconciling price sources...',
  },
  {
    step: 'option_generation',
    message: 'Generating Good / Better / Best options...',
  },
  {
    step: 'calculation',
    message: 'Calculating final totals and line items...',
  },
];

export async function* generateSSEEvents(
  options: MockSSEOptions = {},
): AsyncGenerator<SSEEvent> {
  const duration = options.duration ?? 10_000;
  const stepDelay = Math.floor(duration / PIPELINE_STEPS.length);

  for (let i = 0; i < PIPELINE_STEPS.length; i++) {
    const { step, message } = PIPELINE_STEPS[i];

    // Emit "running" status
    yield {
      event: 'progress',
      data: JSON.stringify({
        step,
        status: 'running',
        message,
      }),
    };

    // Simulate work
    await sleep(stepDelay);

    // Check for simulated error at step 4 (price_merge)
    if (options.simulateError && i === 3) {
      yield {
        event: 'progress',
        data: JSON.stringify({
          step,
          status: 'error',
          message: 'Failed to merge pricing data — timeout from 1Build API',
        }),
      };
      yield {
        event: 'error',
        data: 'Pipeline failed at price_merge step',
      };
      return;
    }

    // Emit "complete" status for this step
    yield {
      event: 'progress',
      data: JSON.stringify({
        step,
        status: 'complete',
        message: `${message.replace('...', '')} done`,
      }),
    };
  }

  // All steps done
  yield { event: 'complete', data: '' };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
