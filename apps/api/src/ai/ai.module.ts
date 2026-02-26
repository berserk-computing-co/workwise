import { Global, Module } from '@nestjs/common';
import { AnthropicProvider } from './anthropic/anthropic.provider.js';
import { AgentRunner } from './agent-runner.service.js';
import { AI_PROVIDER } from './interfaces/provider.interface.js';

@Global()
@Module({
  providers: [
    {
      provide: AI_PROVIDER,
      useClass: AnthropicProvider,
    },
    AgentRunner,
  ],
  exports: [AI_PROVIDER, AgentRunner],
})
export class AiModule {}
