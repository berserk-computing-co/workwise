import { JobProgressService, ProgressEvent } from "./job-progress.service.js";
import { StepStatus } from "../pipeline.enums.js";

describe("JobProgressService", () => {
  let service: JobProgressService;

  beforeEach(() => {
    service = new JobProgressService();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  const makeEvent = (step = "step1"): ProgressEvent => ({
    step,
    status: StepStatus.Running,
    message: "running",
  });

  it("createJob() makes has() return true", () => {
    expect(service.has("job-a")).toBe(false);
    service.createJob("job-a");
    expect(service.has("job-a")).toBe(true);
  });

  it("emit() publishes events to subscribers", (done) => {
    service.createJob("job-b");
    const received: ProgressEvent[] = [];

    service.subscribe("job-b")!.subscribe({
      next: (e) => received.push(e),
      complete: () => {
        expect(received).toHaveLength(1);
        expect(received[0].step).toBe("step1");
        done();
      },
    });

    service.emit("job-b", makeEvent("step1"));
    service.complete("job-b");
    jest.advanceTimersByTime(1000);
  });

  it("emit() on unknown jobId is a no-op and does not throw", () => {
    expect(() => service.emit("nonexistent", makeEvent())).not.toThrow();
  });

  it("subscribe() returns Observable for known job", () => {
    service.createJob("job-c");
    const obs = service.subscribe("job-c");
    expect(obs).not.toBeNull();
  });

  it("subscribe() returns null for unknown job", () => {
    expect(service.subscribe("no-such-job")).toBeNull();
  });

  it("complete() completes the observable", (done) => {
    service.createJob("job-d");

    service.subscribe("job-d")!.subscribe({
      complete: () => done(),
    });

    service.complete("job-d");
    jest.advanceTimersByTime(1000);
  });

  it("error() emits event then completes the observable", (done) => {
    service.createJob("job-e");
    const received: ProgressEvent[] = [];

    service.subscribe("job-e")!.subscribe({
      next: (e) => received.push(e),
      complete: () => {
        expect(received).toHaveLength(1);
        expect(received[0].status).toBe(StepStatus.Error);
        done();
      },
    });

    service.error("job-e", {
      step: "failStep",
      status: StepStatus.Error,
      message: "boom",
    });
    jest.advanceTimersByTime(1000);
  });

  it("has() returns false for unknown jobs", () => {
    expect(service.has("definitely-not-a-job")).toBe(false);
  });
});
