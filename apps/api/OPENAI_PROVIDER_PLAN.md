# OpenAI Provider Integration Plan

## Why

Claude Haiku 4.5 ($1/$5) is unreliable for multi-turn tool-use agents and expensive relative to alternatives. GPT-4.1 mini ($0.40/$1.60) is 2.5x cheaper on input, 3x cheaper on output, gets a 75% cache discount, and was specifically designed by OpenAI for agentic tool-use reliability.

### Cost Comparison (per 1M tokens)

| Model | Input | Cached Input | Output | Tool Reliability |
|---|---|---|---|---|
| Claude Haiku 4.5 | $1.00 | $0.10 | $5.00 | Unreliable (skips tools) |
| Claude Sonnet 4.6 | $3.00 | $0.30 | $15.00 | Reliable |
| **GPT-4.1 mini** | **$0.40** | **$0.10** | **$1.60** | **Designed for agents** |
| GPT-4.1 nano | $0.10 | $0.025 | $0.40 | Poor (known issues) |
| GPT-5 mini | $0.25 | $0.025 | $2.00 | Good |

Both Anthropic and OpenAI charge $0.01/web search.

## Current Architecture

```
AgentConfig (model string) → AgentRunner → @Inject(AI_PROVIDER) → AnthropicProvider → Anthropic SDK
```

Key files:
- `ai/interfaces/provider.interface.ts` — provider-agnostic `AiProvider` interface, `ChatParams`, `ChatResponse`
- `ai/interfaces/agent.interfaces.ts` — `AgentConfig`, `AgentResult`, `AgentTool`
- `ai/anthropic/anthropic.provider.ts` — only file that imports `@anthropic-ai/sdk`
- `ai/agent-runner.service.ts` — multi-turn loop, two-phase mode, rate-limit retry
- `ai/ai.module.ts` — binds `AI_PROVIDER` token to `AnthropicProvider`

The `AiProvider` interface is already provider-agnostic by design. Adding OpenAI means implementing `AiProvider.chat()` with the OpenAI SDK translation layer, then routing between providers based on model prefix.

## Design: Model-Based Provider Routing

```
AgentConfig { model: "gpt-4.1-mini" }
        │
        ▼
   AgentRunner
        │
        ▼
@Inject(AI_PROVIDER) → ProviderRouter (implements AiProvider)
        │                     │
        ├── model "claude-*"  ├── model "gpt-*"
        ▼                     ▼
  AnthropicProvider     OpenAIProvider
```

### How it works

1. `ProviderRouter` implements `AiProvider` and is bound to `AI_PROVIDER`
2. `chat()` inspects `params.model` prefix to delegate:
   - `claude-` → `AnthropicProvider`
   - `gpt-` → `OpenAIProvider`
   - Unknown → throw with clear error
3. AgentRunner, pipeline steps, and all callers are **completely unchanged**
4. Agent configs just change `model: "gpt-4.1-mini"` to switch providers

### Backwards compatibility

- Zero changes to `AgentRunner`, `AgentConfig`, `AgentResult`, `AgentTool`
- Zero changes to pipeline steps (`PriceResolutionStep`, `WebPriceResolutionStep`, etc.)
- Zero changes to agent services (`OneBuildAgentService`, `WebPricingAgentService`)
- Only changes: model string in agent configs + new files

## Implementation Steps

### Step 1: Install OpenAI SDK

```bash
cd apps/api && npm install openai
```

Add `OPENAI_API_KEY` to `.env` (placeholder) and `.env.local` (real key).

### Step 2: Create `OpenAIProvider`

New file: `ai/openai/openai.provider.ts`

Implements `AiProvider.chat()` using OpenAI Chat Completions API:

```typescript
@Injectable()
export class OpenAIProvider implements AiProvider {
  private readonly client: OpenAI;

  constructor(config: ConfigService) {
    this.client = new OpenAI({
      apiKey: config.getOrThrow<string>("OPENAI_API_KEY"),
    });
  }

  async chat(params: ChatParams): Promise<ChatResponse> { ... }
}
```

**Translation mapping:**

| ChatParams field | OpenAI equivalent |
|---|---|
| `model` | `model` |
| `system` | `messages[0]: { role: "system", content: ... }` |
| `messages` | Chat Completions `messages` array |
| `tools` | `tools` (with `{ type: "function", function: { name, description, parameters, strict: true } }` wrapper) |
| `serverTools` | Not supported in Chat Completions — see Step 5 |
| `maxTokens` | `max_tokens` |
| `outputFormat` | `response_format: { type: "json_schema", json_schema: { name: "output", schema: ..., strict: true } }` |

**Response mapping:**

| OpenAI response | ChatResponse field |
|---|---|
| `choices[0].message.content` | `text` |
| `choices[0].message.tool_calls` | `toolCalls` (map `id`, `function.name`, `JSON.parse(function.arguments)`) |
| `choices[0].finish_reason` | `stopReason` (`"stop"` → `"end_turn"`, `"tool_calls"` → `"tool_use"`, `"length"` → `"max_tokens"`) |
| `usage.prompt_tokens` | `usage.inputTokens` |
| `usage.completion_tokens` | `usage.outputTokens` |

**Message history mapping:**

| ChatContentBlock type | OpenAI format |
|---|---|
| `text` (assistant) | `{ role: "assistant", content: "..." }` |
| `tool_use` (assistant) | `{ role: "assistant", tool_calls: [{ id, type: "function", function: { name, arguments } }] }` |
| `tool_result` (user) | `{ role: "tool", tool_call_id: "...", content: "..." }` |
| `server_tool_use/result` | Not applicable — throw if encountered |

**Key differences to handle:**
- OpenAI tool results use `role: "tool"` (not embedded in user messages)
- OpenAI assistant messages with tool calls have `content: null` + `tool_calls` array (not mixed content blocks)
- OpenAI requires `parallel_tool_calls: false` when using `response_format` with tools
- OpenAI doesn't have `pause_turn` — server tools work differently

### Step 3: Create `ProviderRouter`

New file: `ai/provider-router.service.ts`

```typescript
@Injectable()
export class ProviderRouter implements AiProvider {
  constructor(
    private readonly anthropic: AnthropicProvider,
    private readonly openai: OpenAIProvider,
  ) {}

  async chat(params: ChatParams): Promise<ChatResponse> {
    if (params.model.startsWith("claude-")) return this.anthropic.chat(params);
    if (params.model.startsWith("gpt-")) return this.openai.chat(params);
    throw new Error(`Unknown model prefix: ${params.model}`);
  }
}
```

### Step 4: Update `AiModule`

```typescript
@Global()
@Module({
  providers: [
    AnthropicProvider,
    OpenAIProvider,
    {
      provide: AI_PROVIDER,
      useClass: ProviderRouter,
    },
    AgentRunner,
  ],
  exports: [AI_PROVIDER, AgentRunner],
})
export class AiModule {}
```

### Step 5: Server Tools (web_search)

OpenAI's built-in web search is only available via the **Responses API**, not Chat Completions. Two options:

**Option A (Recommended): Keep web search on Anthropic**

The `WebPricingAgentService` uses Anthropic's `web_search` server tool — keep it on Claude. Only move the `OneBuildAgentService` (local tools only) to OpenAI. This is the simplest path.

```
OneBuildAgentService  → model: "gpt-4.1-mini"  (local tool: search_1build)
WebPricingAgentService → model: "claude-sonnet-4-6"  (server tool: web_search)
```

**Option B (Future): Add OpenAI Responses API support**

Create a separate `OpenAIResponsesProvider` that uses the Responses API, which supports `web_search_preview` as a built-in tool. This would let you run web search through OpenAI too. But it's a different API shape (not Chat Completions) and more work.

**Option C (Future): Implement web search as a local tool**

Instead of relying on provider-specific server tools, implement web search as a local `AgentTool` using a search API (SerpAPI, Brave Search API, Tavily, etc.). This makes it provider-agnostic and eliminates the server tool dependency. Tavily is popular for agentic search at ~$0.005/search.

### Step 6: Switch Agent Models

After the provider is working:

```typescript
// onebuild-agent.service.ts
const config: AgentConfig = {
  model: "gpt-4.1-mini",  // was "claude-sonnet-4-6"
  // everything else unchanged
};
```

The two-phase approach in AgentRunner still works — it's provider-agnostic. Phase 1 calls chat() without outputFormat (through OpenAI now), Phase 2 calls chat() with outputFormat.

## File Changes Summary

| File | Change |
|---|---|
| `ai/openai/openai.provider.ts` | **New** — OpenAI SDK translation |
| `ai/provider-router.service.ts` | **New** — model-prefix routing |
| `ai/ai.module.ts` | **Modify** — register both providers + router |
| `.env` | **Modify** — add `OPENAI_API_KEY` placeholder |
| `package.json` | **Modify** — add `openai` dependency |

No changes to: `AgentRunner`, `AgentConfig`, `AiProvider` interface, any pipeline steps, any agent services (except swapping model strings).

## Testing Plan

1. Unit test `OpenAIProvider` with mocked OpenAI client (same pattern as `anthropic.provider.spec.ts`)
2. Unit test `ProviderRouter` routing logic
3. Integration test: run OneBuild agent with `gpt-4.1-mini`, verify tool calls happen and results parse correctly
4. Compare output quality: same prompt, same items → Claude vs GPT-4.1-mini results
5. Compare costs: log token usage and calculate per-estimate cost for both providers

## Cost Projection

For a typical 86-item estimate:
- Scope decomposition: ~2K input, ~4K output (keep on Claude)
- OneBuild pricing: ~13K input, ~6K output, ~60 tool calls (move to GPT-4.1-mini)
- Web pricing: ~10K input, ~4K output, ~20 web searches (keep on Claude for web_search)
- Option generation: ~2K input, ~2K output (keep on Claude)
- Calculation: ~2K input, ~1K output (keep on Claude)

**OneBuild step cost comparison (per estimate):**
- Claude Sonnet 4.6: ~$0.13 input + ~$0.09 output = ~$0.22
- GPT-4.1 mini: ~$0.005 input + ~$0.01 output = ~$0.015

That's ~15x cheaper for the most token-heavy step.

## Risks

1. **Message format mismatch**: OpenAI's tool result format (`role: "tool"`) differs from Anthropic's (content blocks in user messages). The `rawAssistantContent` → messages round-trip needs careful testing.
2. **Structured output differences**: OpenAI uses `response_format` with a slightly different schema format than Anthropic's `output_config`. The Zod schemas should work via `zodResponseFormat` from the OpenAI SDK.
3. **No `pause_turn`**: OpenAI doesn't have this stop reason. If a future agent config uses server tools via OpenAI Responses API, this would need handling.
4. **API key management**: Need `OPENAI_API_KEY` in all environments (dev, staging, prod).
