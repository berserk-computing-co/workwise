import { ScopeDecompositionStep } from './steps/scope-decomposition.step.js';
import { WebPriceResolutionStep } from './steps/web-price-resolution.step.js';
import { OptionGenerationStep } from './steps/option-generation.step.js';
import { CalculationStep } from './steps/calculation.step.js';
import { PricingFanOutService } from './agents/pricing-fan-out.service.js';
import { PipelineRunner } from '../../pipeline/services/pipeline-runner.service.js';
import type { BidEngineContext } from './bidengine-context.js';
import { ItemCategory, ItemSource, OptionTier } from './bidengine.enums.js';
import { Section } from '../../projects/entities/section.entity.js';
import { Item } from '../../projects/entities/item.entity.js';
import { Option } from '../../projects/entities/option.entity.js';
import { Project } from '../../projects/entities/project.entity.js';
import { StepStatus } from '../../pipeline/pipeline.enums.js';

// ---------------------------------------------------------------------------
// Canned AI responses — must match the Zod schemas used by the steps.
// scopeDecompositionSchema expects: project_type, classification_reasoning,
//   sections[], confidence
// optionGenerationSchema expects: options[]
// ---------------------------------------------------------------------------

const SCOPE_RESPONSE_TEXT = JSON.stringify({
  project_type: 'construction',
  classification_reasoning: 'Residential bathroom renovation.',
  confidence: 0.9,
  sections: [
    {
      name: 'Plumbing',
      labor_hours: 8,
      items: [
        {
          description: 'PVC pipe 1/2"',
          quantity: 20,
          unit: 'LF',
          category: ItemCategory.Material,
          pricing_hint: 'material',
          confidence: 'high',
        },
        {
          description: 'Plumber labor',
          quantity: 8,
          unit: 'HR',
          category: ItemCategory.Labor,
          pricing_hint: 'labor_rate',
          confidence: 'high',
        },
      ],
    },
    {
      name: 'Tiling',
      labor_hours: 6,
      items: [
        {
          description: 'Ceramic tile 12x12',
          quantity: 50,
          unit: 'SF',
          category: ItemCategory.Material,
          pricing_hint: 'material',
          confidence: 'medium',
        },
      ],
    },
  ],
});

const OPTION_RESPONSE_TEXT = JSON.stringify({
  options: [
    {
      tier: OptionTier.Good,
      label: 'Budget',
      description: 'Standard materials, simplified scope.',
      multiplier: 0.8,
      is_recommended: false,
      overrides: {},
    },
    {
      tier: OptionTier.Better,
      label: 'Standard',
      description: 'Base estimate as specified.',
      multiplier: 1.0,
      is_recommended: true,
      overrides: {},
    },
    {
      tier: OptionTier.Best,
      label: 'Premium',
      description: 'Upgraded materials and finishes.',
      multiplier: 1.3,
      is_recommended: false,
      overrides: {},
    },
  ],
});

describe('BidEngine pipeline integration', () => {
  let mockProvider: { chat: jest.Mock };
  let mockFilesService: { findAllByProject: jest.Mock; getBase64: jest.Mock };
  let mockMaterialAgent: { priceItems: jest.Mock };
  let mockLaborAgent: { priceItems: jest.Mock };
  let mockJobProgress: {
    emit: jest.Mock;
    createJob: jest.Mock;
    complete: jest.Mock;
    has: jest.Mock;
  };
  let mockManager: { delete: jest.Mock; save: jest.Mock; update: jest.Mock };
  let mockDataSource: { transaction: jest.Mock };

  let scopeStep: ScopeDecompositionStep;
  let webPriceStep: WebPriceResolutionStep;
  let optionStep: OptionGenerationStep;
  let calcStep: CalculationStep;
  let fanOut: PricingFanOutService;
  let runner: PipelineRunner;

  let signal: AbortSignal;

  function buildContext(): BidEngineContext {
    return {
      projectId: 'proj-integration-1',
      jobId: 'job-test-1',
      description: 'Bathroom remodel with plumbing and tiling',
      address: '123 Main St',
      zipCode: '90210',
      city: 'Beverly Hills',
      state: 'CA',
      category: 'plumbing',
    };
  }

  beforeEach(() => {
    signal = new AbortController().signal;

    // Mock AI provider — returns scope on first call, options on second call
    mockProvider = {
      chat: jest.fn(),
    };

    // Mock files service — no images
    mockFilesService = {
      findAllByProject: jest.fn().mockResolvedValue([]),
      getBase64: jest.fn(),
    };

    // Mock pricing agents
    mockMaterialAgent = { priceItems: jest.fn() };
    mockLaborAgent = { priceItems: jest.fn() };

    // Mock job progress
    mockJobProgress = {
      emit: jest.fn(),
      createJob: jest.fn(),
      complete: jest.fn(),
      has: jest.fn(),
    };

    // Mock TypeORM manager and datasource
    mockManager = {
      delete: jest.fn().mockResolvedValue(undefined),
      save: jest
        .fn()
        .mockImplementation((_entity, data) =>
          Promise.resolve({ id: 'mock-id', ...data }),
        ),
      update: jest.fn().mockResolvedValue(undefined),
    };
    mockDataSource = {
      transaction: jest.fn().mockImplementation((cb) => cb(mockManager)),
    };

    // Instantiate real services with mocked deps
    fanOut = new PricingFanOutService(
      mockMaterialAgent as any,
      mockLaborAgent as any,
    );
    scopeStep = new ScopeDecompositionStep(
      mockFilesService as any,
      mockProvider as any,
    );
    webPriceStep = new WebPriceResolutionStep(fanOut, mockJobProgress as any);
    optionStep = new OptionGenerationStep(mockProvider as any);
    calcStep = new CalculationStep(mockDataSource as any);
    runner = new PipelineRunner();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('full pipeline happy path', () => {
    beforeEach(() => {
      // Scope decomposition call
      mockProvider.chat.mockResolvedValueOnce({
        text: SCOPE_RESPONSE_TEXT,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 200 },
        rawAssistantContent: [],
      });

      // Option generation call
      mockProvider.chat.mockResolvedValueOnce({
        text: OPTION_RESPONSE_TEXT,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 80, outputTokens: 150 },
        rawAssistantContent: [],
      });

      // Material agent: Plumbing section (PVC pipe)
      mockMaterialAgent.priceItems.mockResolvedValueOnce([
        {
          index: 0,
          matched: true,
          unitCost: 1.5,
          confidence: 0.9,
          category: 'material',
          retailer: 'Home Depot',
          sourceUrl: 'https://homedepot.com/p/pvc-pipe',
        },
      ]);

      // Labor agent: Plumbing section (plumber labor)
      mockLaborAgent.priceItems.mockResolvedValueOnce([
        {
          index: 0,
          matched: false,
          unitCost: 0,
          confidence: 0.5,
          category: 'labor',
        },
      ]);

      // Material agent: Tiling section (ceramic tile)
      mockMaterialAgent.priceItems.mockResolvedValueOnce([
        {
          index: 0,
          matched: true,
          unitCost: 3.0,
          confidence: 0.85,
          category: 'material',
          retailer: 'Floor & Decor',
          sourceUrl: 'https://flooranddecor.com/p/tile',
        },
      ]);
    });

    it('populates context.sections after scope decomposition step', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);

      expect(context.sections).toHaveLength(2);
      expect(context.sections![0].name).toBe('Plumbing');
      expect(context.sections![0].items).toHaveLength(2);
      expect(context.sections![1].name).toBe('Tiling');
      expect(context.sections![1].items).toHaveLength(1);
      expect(context.projectType).toBe('construction');
    });

    it('populates context.pricedItems with correct sectionNames after web price step', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);

      expect(context.pricedItems).toHaveLength(3);

      const plumbingItems = context.pricedItems!.filter(
        (p) => p.sectionName === 'Plumbing',
      );
      expect(plumbingItems).toHaveLength(2);

      const tilingItems = context.pricedItems!.filter(
        (p) => p.sectionName === 'Tiling',
      );
      expect(tilingItems).toHaveLength(1);
    });

    it('matched items have WebPriced source, unmatched have AiUnmatched', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);

      const pvcPipe = context.pricedItems!.find(
        (p) => p.description === 'PVC pipe 1/2"',
      );
      expect(pvcPipe).toBeDefined();
      expect(pvcPipe!.source).toBe(ItemSource.WebPriced);
      expect(pvcPipe!.unitCost).toBe(1.5);
      expect(pvcPipe!.sourceUrl).toBe('https://homedepot.com/p/pvc-pipe');

      const plumberLabor = context.pricedItems!.find(
        (p) => p.description === 'Plumber labor',
      );
      expect(plumberLabor).toBeDefined();
      expect(plumberLabor!.source).toBe(ItemSource.AiUnmatched);
    });

    it('populates context.options with 3 tiers after option generation step', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);
      await optionStep.execute(context, signal);

      expect(context.options).toHaveLength(3);
      const tiers = context.options!.map((o) => o.tier);
      expect(tiers).toContain(OptionTier.Good);
      expect(tiers).toContain(OptionTier.Better);
      expect(tiers).toContain(OptionTier.Best);

      const recommended = context.options!.filter((o) => o.isRecommended);
      expect(recommended).toHaveLength(1);
      expect(recommended[0].tier).toBe(OptionTier.Better);
    });

    it('runs all 4 steps via PipelineRunner and calls repo saves', async () => {
      const context = buildContext();
      const onProgress = jest.fn();
      const controller = new AbortController();

      await runner.run(
        'job-test-1',
        context,
        [scopeStep, webPriceStep, optionStep, calcStep],
        onProgress,
        controller,
      );

      // Context fully populated
      expect(context.sections).toHaveLength(2);
      expect(context.pricedItems).toHaveLength(3);
      expect(context.options).toHaveLength(3);
      expect(context.totals).toBeDefined();

      // Transaction was called
      expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);

      // Old data was deleted before writing new
      expect(mockManager.delete).toHaveBeenCalledWith(Section, {
        projectId: 'proj-integration-1',
      });
      expect(mockManager.delete).toHaveBeenCalledWith(Option, {
        projectId: 'proj-integration-1',
      });

      // Sections saved
      const sectionSaveCalls = mockManager.save.mock.calls.filter(
        ([entity]) => entity === Section,
      );
      expect(sectionSaveCalls).toHaveLength(2);
      expect(sectionSaveCalls[0][1].name).toBe('Plumbing');
      expect(sectionSaveCalls[1][1].name).toBe('Tiling');

      // Options saved
      const optionSaveCalls = mockManager.save.mock.calls.filter(
        ([entity]) => entity === Option,
      );
      expect(optionSaveCalls).toHaveLength(3);

      // Project status updated
      expect(mockManager.update).toHaveBeenCalledWith(
        Project,
        'proj-integration-1',
        expect.objectContaining({ status: 'generated' }),
      );

      // Progress callbacks fired for each step
      expect(onProgress).toHaveBeenCalledWith(
        'scope_decomposition',
        StepStatus.Complete,
        expect.any(String),
      );
      expect(onProgress).toHaveBeenCalledWith(
        'web_price_resolution',
        StepStatus.Complete,
        expect.any(String),
      );
      expect(onProgress).toHaveBeenCalledWith(
        'option_generation',
        StepStatus.Complete,
        expect.any(String),
      );
      expect(onProgress).toHaveBeenCalledWith(
        'calculation',
        StepStatus.Complete,
        expect.any(String),
      );
    });

    it('calculates totals correctly: sum(quantity * unitCost)', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);
      await optionStep.execute(context, signal);
      await calcStep.execute(context, signal);

      // PVC pipe: 20 * 1.5 = 30
      // Plumber labor: 8 * 0 = 0 (unmatched)
      // Ceramic tile: 50 * 3.0 = 150
      // total = 180
      expect(context.totals!.total).toBe(180);
    });
  });

  describe('pipeline with pricing failures', () => {
    beforeEach(() => {
      // Scope decomposition call
      mockProvider.chat.mockResolvedValueOnce({
        text: SCOPE_RESPONSE_TEXT,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 200 },
        rawAssistantContent: [],
      });

      // Option generation call
      mockProvider.chat.mockResolvedValueOnce({
        text: OPTION_RESPONSE_TEXT,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 80, outputTokens: 150 },
        rawAssistantContent: [],
      });

      // Material agent for Plumbing section — fails
      mockMaterialAgent.priceItems.mockRejectedValueOnce(
        new Error('network timeout'),
      );

      // Labor agent for Plumbing section — succeeds
      mockLaborAgent.priceItems.mockResolvedValueOnce([
        {
          index: 0,
          matched: false,
          unitCost: 0,
          confidence: 0.5,
          category: 'labor',
        },
      ]);

      // Material agent for Tiling section — succeeds
      mockMaterialAgent.priceItems.mockResolvedValueOnce([
        {
          index: 0,
          matched: true,
          unitCost: 3.0,
          confidence: 0.85,
          category: 'material',
          retailer: 'Floor & Decor',
          sourceUrl: 'https://flooranddecor.com/p/tile',
        },
      ]);
    });

    it('pipeline still completes when one pricing batch fails', async () => {
      const context = buildContext();
      const onProgress = jest.fn();
      const controller = new AbortController();

      await expect(
        runner.run(
          'job-test-2',
          context,
          [scopeStep, webPriceStep, optionStep, calcStep],
          onProgress,
          controller,
        ),
      ).resolves.not.toThrow();

      expect(context.pricedItems).toHaveLength(3);
      expect(context.totals).toBeDefined();
    });

    it('failed pricing batch items have AiUnmatched source and unitCost 0', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);

      // The PVC pipe came from the failed Plumbing material batch
      const pvcPipe = context.pricedItems!.find(
        (p) => p.description === 'PVC pipe 1/2"',
      );
      expect(pvcPipe).toBeDefined();
      expect(pvcPipe!.source).toBe(ItemSource.AiUnmatched);
      expect(pvcPipe!.unitCost).toBe(0);
    });

    it('succeeding items in other sections still get priced correctly', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);

      const tile = context.pricedItems!.find(
        (p) => p.description === 'Ceramic tile 12x12',
      );
      expect(tile).toBeDefined();
      expect(tile!.source).toBe(ItemSource.WebPriced);
      expect(tile!.unitCost).toBe(3.0);
      expect(tile!.sectionName).toBe('Tiling');
    });

    it('totals are still computed from available prices', async () => {
      const context = buildContext();
      await scopeStep.execute(context, signal);
      await webPriceStep.execute(context, signal);
      await optionStep.execute(context, signal);
      await calcStep.execute(context, signal);

      // Only ceramic tile is priced: 50 * 3.0 = 150
      // Failed + unmatched items contribute 0
      expect(context.totals!.total).toBe(150);
    });
  });

  describe('AbortSignal cancellation', () => {
    it('pipeline aborts early when signal is triggered before execution', async () => {
      const controller = new AbortController();
      controller.abort();

      // Scope mock (should not be called)
      mockProvider.chat.mockResolvedValue({
        text: SCOPE_RESPONSE_TEXT,
        toolCalls: [],
        stopReason: 'end_turn',
        usage: { inputTokens: 100, outputTokens: 200 },
        rawAssistantContent: [],
      });

      const context = buildContext();
      const onProgress = jest.fn();

      await expect(
        runner.run(
          'job-abort-1',
          context,
          [scopeStep, webPriceStep, optionStep, calcStep],
          onProgress,
          controller,
        ),
      ).rejects.toThrow();

      // No step should have run
      expect(mockProvider.chat).not.toHaveBeenCalled();
    });
  });
});
