import { PipelineRunner } from "./pipeline-runner.service.js";
import { StepStatus } from "../pipeline.enums.js";
import type { PipelineStep } from "../pipeline-step.interface.js";

describe("PipelineRunner", () => {
  let runner: PipelineRunner;

  beforeEach(() => {
    runner = new PipelineRunner();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("executes steps sequentially in order", async () => {
    const order: string[] = [];
    const stepA: PipelineStep<object> = {
      name: "stepA",
      execute: jest.fn().mockImplementation(async () => {
        order.push("A");
      }),
    };
    const stepB: PipelineStep<object> = {
      name: "stepB",
      execute: jest.fn().mockImplementation(async () => {
        order.push("B");
      }),
    };

    await runner.run("job-1", {}, [stepA, stepB], jest.fn());

    expect(order).toEqual(["A", "B"]);
    expect(stepA.execute).toHaveBeenCalledTimes(1);
    expect(stepB.execute).toHaveBeenCalledTimes(1);
  });

  it("fires onProgress(name, Running) then onProgress(name, Complete) per step", async () => {
    const onProgress = jest.fn();
    const step: PipelineStep<object> = {
      name: "myStep",
      execute: jest.fn().mockResolvedValue(undefined),
    };

    await runner.run("job-2", {}, [step], onProgress);

    expect(onProgress).toHaveBeenCalledTimes(2);
    expect(onProgress).toHaveBeenNthCalledWith(
      1,
      "myStep",
      StepStatus.Running,
      expect.any(String),
    );
    expect(onProgress).toHaveBeenNthCalledWith(
      2,
      "myStep",
      StepStatus.Complete,
      expect.any(String),
    );
  });

  it("completes without error when steps array is empty", async () => {
    const onProgress = jest.fn();
    await expect(
      runner.run("job-3", {}, [], onProgress),
    ).resolves.toBeUndefined();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by step.execute()", async () => {
    const error = new Error("step failed");
    const step: PipelineStep<object> = {
      name: "failingStep",
      execute: jest.fn().mockRejectedValue(error),
    };

    await expect(runner.run("job-4", {}, [step], jest.fn())).rejects.toThrow(
      "step failed",
    );
  });
});
