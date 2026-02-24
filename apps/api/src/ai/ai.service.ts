import { Injectable } from '@nestjs/common';
import { generateObject, generateText, stepCountIs } from 'ai';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI } from '@ai-sdk/openai';
import type { ZodType } from 'zod';
import type { ToolSet } from 'ai';

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

@Injectable()
export class AiService {
  private readonly anthropic = createAnthropic();
  private readonly openai = createOpenAI();

  async generateObject<T>(options: {
    model?: string;
    system: string;
    prompt: string;
    schema: ZodType<T>;
  }): Promise<T> {
    const modelId = options.model ?? DEFAULT_MODEL;
    const { object } = await generateObject({
      model: this.getModel(modelId),
      system: options.system,
      prompt: options.prompt,
      schema: options.schema,
    });
    return object as T;
  }

  async generateText(options: {
    model?: string;
    system: string;
    prompt: string;
    tools?: ToolSet;
    maxSteps?: number;
  }): Promise<string> {
    const modelId = options.model ?? DEFAULT_MODEL;
    const { text } = await generateText({
      model: this.getModel(modelId),
      system: options.system,
      prompt: options.prompt,
      tools: options.tools,
      stopWhen: stepCountIs(options.maxSteps ?? 10),
    });
    return text;
  }

  private getModel(modelId: string) {
    if (modelId.startsWith('claude-') || modelId.startsWith('anthropic/')) {
      return this.anthropic(modelId);
    }
    return this.openai(modelId);
  }
}
