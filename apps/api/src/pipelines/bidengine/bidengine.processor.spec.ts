import { BidEngineProcessor } from "./bidengine.processor.js";

const mockProject = {
  id: "proj-1",
  description: "Kitchen remodel",
  address: "123 Main St",
  zipCode: "90210",
  category: "kitchen",
};

const mockProjectRepo = {
  findOneOrFail: jest.fn().mockResolvedValue(mockProject),
  update: jest.fn(),
};

const mockPipelineRunner = {
  run: jest.fn().mockImplementation(async (_jobId: string, context: any) => {
    context.totals = { total: 5000 };
  }),
};

const mockCancellationService = {
  watch: jest.fn().mockReturnValue({
    controller: new AbortController(),
    cleanup: jest.fn(),
  }),
};

const mockPipelineJobs = {
  start: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
  cancel: jest.fn(),
  updateStep: jest.fn(),
};

const mockScopeStep = { name: "scope_decomposition", execute: jest.fn() };
const mockWebPriceStep = { name: "web_price_resolution", execute: jest.fn() };
const mockOptionStep = { name: "option_generation", execute: jest.fn() };
const mockCalcStep = { name: "calculation", execute: jest.fn() };

const mockJob = {
  id: "job-1",
  data: { projectId: "proj-1", organizationId: "org-1" },
};

function makeProcessor() {
  return new BidEngineProcessor(
    mockProjectRepo as any,
    mockPipelineRunner as any,
    mockPipelineJobs as any,
    mockScopeStep as any,
    mockOptionStep as any,
    mockCalcStep as any,
    mockWebPriceStep as any,
    mockCancellationService as any,
  );
}

describe("BidEngineProcessor", () => {
  let processor: BidEngineProcessor;

  beforeEach(() => {
    processor = makeProcessor();
    jest.clearAllMocks();
    mockProjectRepo.findOneOrFail.mockResolvedValue(mockProject);
    mockCancellationService.watch.mockReturnValue({
      controller: new AbortController(),
      cleanup: jest.fn(),
    });
    mockPipelineRunner.run.mockImplementation(
      async (_jobId: string, context: any) => {
        context.totals = { total: 5000 };
      },
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("calls pipelineJobs.start(jobId)", async () => {
    await processor.process(mockJob as any);

    expect(mockPipelineJobs.start).toHaveBeenCalledWith("job-1");
  });

  it("loads project via projectRepo.findOneOrFail", async () => {
    await processor.process(mockJob as any);

    expect(mockProjectRepo.findOneOrFail).toHaveBeenCalledWith({
      where: { id: "proj-1" },
    });
  });

  it("builds BidEngineContext from project fields", async () => {
    await processor.process(mockJob as any);

    const [, context] = mockPipelineRunner.run.mock.calls[0];
    expect(context).toMatchObject({
      projectId: mockProject.id,
      description: mockProject.description,
      address: mockProject.address,
      zipCode: mockProject.zipCode,
      category: mockProject.category,
    });
  });

  it("calls pipelineRunner.run with 4 sequential steps", async () => {
    await processor.process(mockJob as any);

    expect(mockPipelineRunner.run).toHaveBeenCalledTimes(1);
    const [jobId, , steps, onProgress] = mockPipelineRunner.run.mock.calls[0];
    expect(jobId).toBe("job-1");
    expect(steps).toEqual([
      mockScopeStep,
      mockWebPriceStep,
      mockOptionStep,
      mockCalcStep,
    ]);
    expect(typeof onProgress).toBe("function");
  });

  it("passes onProgress callback that calls pipelineJobs.updateStep", async () => {
    await processor.process(mockJob as any);

    const [, , , onProgress] = mockPipelineRunner.run.mock.calls[0];
    onProgress("scope_decomposition", "running", "Processing scope");

    expect(mockPipelineJobs.updateStep).toHaveBeenCalledWith(
      "job-1",
      "scope_decomposition",
      "running",
      "Processing scope",
    );
  });

  it("calls pipelineJobs.complete(jobId, { total }) on success", async () => {
    await processor.process(mockJob as any);

    expect(mockPipelineJobs.complete).toHaveBeenCalledWith("job-1", {
      total: 5000,
    });
  });

  it("calls pipelineJobs.fail(jobId, message) and re-throws on pipeline error", async () => {
    const error = new Error("Pipeline failed");
    mockPipelineRunner.run.mockRejectedValueOnce(error);

    await expect(processor.process(mockJob as any)).rejects.toThrow(
      "Pipeline failed",
    );

    expect(mockPipelineJobs.fail).toHaveBeenCalledWith(
      "job-1",
      "Pipeline failed",
    );
    expect(mockPipelineJobs.complete).not.toHaveBeenCalled();
  });
});
