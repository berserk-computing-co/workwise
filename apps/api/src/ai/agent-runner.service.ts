import { Inject, Injectable, Logger } from '@nestjs/common';
import type { AiProvider, ChatMessage, ChatContentBlock } from './interfaces/provider.interface.js';
import { AI_PROVIDER } from './interfaces/provider.interface.js';
import type { AgentConfig, AgentResult, AgentStep } from './interfaces/agent.interfaces.js';

@Injectable()
export class AgentRunner {
  private readonly logger = new Logger(AgentRunner.name);

  constructor(@Inject(AI_PROVIDER) private readonly provider: AiProvider) {}

  async run(config: AgentConfig, initialPrompt: string): Promise<AgentResult> {
    // TODO: pair-program implementation
    // See TECHNICAL_PLAN.md Step 2C-2 for full implementation reference
    throw new Error('Not implemented — pair programming session');
  }
}
