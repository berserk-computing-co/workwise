import { PipelineRunner } from "./pipeline-runner.service.js";
import { StepStatus } from "../pipeline.enums.js";
import type { PipelineStep } from "../pipeline-step.interface.js";

describe("PipelineRunner", () => {
  let runner: PipelineRunner;
  let controller: AbortController;

  beforeEach(() => {
    runner = new PipelineRunner();
    controller = new AbortController();
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

    await runner.run("job-1", {}, [stepA, stepB], jest.fn(), controller);

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

    await runner.run("job-2", {}, [step], onProgress, controller);

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
      runner.run("job-3", {}, [], onProgress, controller),
    ).resolves.toBeUndefined();
    expect(onProgress).not.toHaveBeenCalled();
  });

  it("propagates errors thrown by step.execute()", async () => {
    const error = new Error("step failed");
    const step: PipelineStep<object> = {
      name: "failingStep",
      execute: jest.fn().mockRejectedValue(error),
    };

    await expect(
      runner.run("job-4", {}, [step], jest.fn(), controller),
    ).rejects.toThrow("step failed");
  });

  it("executes parallel step groups concurrently", async () => {
    const executed: string[] = [];
    const stepB: PipelineStep<object> = {
      name: "stepB",
      execute: jest.fn().mockImplementation(async () => {
        executed.push("B");
      }),
    };
    const stepC: PipelineStep<object> = {
      name: "stepC",
      execute: jest.fn().mockImplementation(async () => {
        executed.push("C");
      }),
    };

    await runner.run("job-5", {}, [[stepB, stepC]], jest.fn(), controller);

    expect(stepB.execute).toHaveBeenCalledTimes(1);
    expect(stepC.execute).toHaveBeenCalledTimes(1);
    expect(executed).toContain("B");
    expect(executed).toContain("C");
  });

  it("continues pipeline after parallel step failure", async () => {
    const stepFail: PipelineStep<object> = {
      name: "stepFail",
      execute: jest.fn().mockRejectedValue(new Error("parallel failure")),
    };
    const stepOk: PipelineStep<object> = {
      name: "stepOk",
      execute: jest.fn().mockResolvedValue(undefined),
    };
    const stepAfter: PipelineStep<object> = {
      name: "stepAfter",
      execute: jest.fn().mockResolvedValue(undefined),
    };

    await expect(
      runner.run("job-6", {}, [[stepFail, stepOk], stepAfter], jest.fn(), controller),
    ).resolves.toBeUndefined();

    expect(stepOk.execute).toHaveBeenCalledTimes(1);
    expect(stepAfter.execute).toHaveBeenCalledTimes(1);
  });

  it("fires Error progress for failed parallel steps", async () => {
    const onProgress = jest.fn();
    const stepFail: PipelineStep<object> = {
      name: "stepFail",
      execute: jest.fn().mockRejectedValue(new Error("boom")),
    };
    const stepOk: PipelineStep<object> = {
      name: "stepOk",
      execute: jest.fn().mockResolvedValue(undefined),
    };

    await runner.run("job-7", {}, [[stepFail, stepOk]], onProgress, controller);

    expect(onProgress).toHaveBeenCalledWith(
      "stepFail",
      StepStatus.Error,
      "boom",
    );
    expect(onProgress).toHaveBeenCalledWith(
      "stepOk",
      StepStatus.Complete,
      expect.any(String),
    );
  });

  it("mixes sequential and parallel steps correctly", async () => {
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
    const stepC: PipelineStep<object> = {
      name: "stepC",
      execute: jest.fn().mockImplementation(async () => {
        order.push("C");
      }),
    };
    const stepD: PipelineStep<object> = {
      name: "stepD",
      execute: jest.fn().mockImplementation(async () => {
        order.push("D");
      }),
    };

    await runner.run("job-8", {}, [stepA, [stepB, stepC], stepD], jest.fn(), controller);

    expect(order[0]).toBe("A");
    expect(order).toContain("B");
    expect(order).toContain("C");
    expect(order[order.length - 1]).toBe("D");
    expect(stepA.execute).toHaveBeenCalledTimes(1);
    expect(stepB.execute).toHaveBeenCalledTimes(1);
    expect(stepC.execute).toHaveBeenCalledTimes(1);
    expect(stepD.execute).toHaveBeenCalledTimes(1);
  });
});
