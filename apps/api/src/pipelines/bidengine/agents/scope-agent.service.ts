import { Injectable } from "@nestjs/common";
import { AgentRunner } from "../../../ai/agent-runner.service.js";
import type { AgentResult } from "../../../ai/interfaces/agent.interfaces.js";
import {
  getScopePrompt,
  buildUserPrompt,
} from "../prompts/scope-decomposition.prompt.js";
import { createWebSearchTool } from "./scope-agent.tool.js";

@Injectable()
export class ScopeAgentService {
  constructor(private readonly agentRunner: AgentRunner) {}

  async decompose(
    description: string,
    category: string,
    zipCode: string,
    address: string,
  ): Promise<AgentResult> {
    const config = {
      name: "scope_decomposition",
      model: "claude-sonnet-4-6",
      systemPrompt: getScopePrompt(category),
      tools: [createWebSearchTool()],
      maxIterations: 5,
      maxTokens: 8192,
    };

    const initialPrompt = buildUserPrompt({
      description,
      zipCode,
      category,
      address,
    });

    return this.agentRunner.run(config, initialPrompt);
  }
}
