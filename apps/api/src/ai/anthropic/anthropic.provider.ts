import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import type {
  MessageParam,
  ContentBlockParam,
  ToolResultBlockParam,
} from '@anthropic-ai/sdk/resources/messages';
import type {
  AiProvider,
  ChatParams,
  ChatResponse,
  ChatMessage,
  ChatContentBlock,
} from '../interfaces/provider.interface.js';

@Injectable()
export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;

  constructor(config: ConfigService) {
    this.client = new Anthropic({
      apiKey: config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async chat(params: ChatParams): Promise<ChatResponse> {
    // TODO: pair-program implementation
    // See TECHNICAL_PLAN.md Step 2C-2 for full implementation reference
    throw new Error('Not implemented — pair programming session');
  }

  private toAnthropicMessages(messages: ChatMessage[]): MessageParam[] {
    // TODO: pair-program implementation
    // See TECHNICAL_PLAN.md Step 2C-2 for full implementation reference
    throw new Error('Not implemented — pair programming session');
  }
}
