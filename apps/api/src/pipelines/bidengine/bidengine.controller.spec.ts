import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { ReplaySubject } from "rxjs";
import { BidEngineController } from "./bidengine.controller.js";
import {
  StepStatus,
  TargetType,
  PipelineType,
} from "../../pipeline/pipeline.enums.js";

const mockUser = { id: "user-1", organizationId: "org-1" };
const mockProject = { id: "proj-1", organizationId: "org-1" };
const mockPipelineJob = { id: "job-1" };

const mockPipelineJobs = {
  create: jest.fn().mockResolvedValue(mockPipelineJob),
  has: jest.fn().mockReturnValue(true),
  subscribe: jest.fn(),
};

const mockQueue = { add: jest.fn() };
const mockProjectRepo = { findOne: jest.fn() };
const mockUsersService = {
  findByAuthIdOrFail: jest.fn().mockResolvedValue(mockUser),
};

function makeController() {
  return new BidEngineController(
    mockPipelineJobs as any,
    mockQueue as any,
    mockProjectRepo as any,
    mockUsersService as any,
  );
}

const mockPayload = { sub: "auth-id-123" };

describe("BidEngineController", () => {
  let controller: BidEngineController;

  beforeEach(() => {
    controller = makeController();
    jest.clearAllMocks();
    mockUsersService.findByAuthIdOrFail.mockResolvedValue(mockUser);
    mockProjectRepo.findOne.mockResolvedValue(mockProject);
    mockPipelineJobs.create.mockResolvedValue(mockPipelineJob);
    mockPipelineJobs.has.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("generate()", () => {
    it("returns { jobId } on success", async () => {
      const result = await controller.generate(mockPayload as any, "proj-1");

      expect(result).toEqual({ jobId: "job-1" });
    });

    it("creates pipeline job with correct params", async () => {
      await controller.generate(mockPayload as any, "proj-1");

      expect(mockPipelineJobs.create).toHaveBeenCalledWith({
        targetId: "proj-1",
        targetType: TargetType.Project,
        pipelineType: PipelineType.BidEngine,
        triggeredBy: "user-1",
      });
    });

    it("adds job to queue with projectId and organizationId", async () => {
      await controller.generate(mockPayload as any, "proj-1");

      expect(mockQueue.add).toHaveBeenCalledWith(
        "generate",
        { projectId: "proj-1", organizationId: "org-1" },
        { jobId: "job-1" },
      );
    });

    it("throws NotFoundException when project not found", async () => {
      mockProjectRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        controller.generate(mockPayload as any, "proj-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("throws ForbiddenException when organization mismatch", async () => {
      mockProjectRepo.findOne.mockResolvedValueOnce({
        id: "proj-1",
        organizationId: "org-2",
      });

      await expect(
        controller.generate(mockPayload as any, "proj-1"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("streamProgress()", () => {
    function makeResMock() {
      return {
        setHeader: jest.fn(),
        flushHeaders: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };
    }

    function makeReqMock() {
      const closeHandlers: Function[] = [];
      const req = {
        on: jest.fn().mockImplementation((event: string, handler: Function) => {
          if (event === "close") closeHandlers.push(handler);
        }),
        _closeHandlers: closeHandlers,
      };
      return req;
    }

    it("returns 404 JSON when pipelineJobs.has() returns false", () => {
      mockPipelineJobs.has.mockReturnValueOnce(false);
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 404,
        error: "Not Found",
        message: "Job not found",
      });
    });

    it("returns 404 JSON when subscribe returns null", () => {
      mockPipelineJobs.subscribe.mockReturnValueOnce(null);
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        statusCode: 404,
        error: "Not Found",
        message: "Job not found",
      });
    });

    it("sets SSE headers", () => {
      const subject = new ReplaySubject();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      expect(res.setHeader).toHaveBeenCalledWith(
        "Content-Type",
        "text/event-stream",
      );
      expect(res.setHeader).toHaveBeenCalledWith("Cache-Control", "no-cache");
      expect(res.setHeader).toHaveBeenCalledWith("Connection", "keep-alive");
      expect(res.flushHeaders).toHaveBeenCalled();
    });

    it("writes events in SSE format: event: progress\\ndata: {...}\\n\\n", () => {
      const subject = new ReplaySubject<any>();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      const event = {
        step: "scope_decomposition",
        status: StepStatus.Running,
        message: "Running",
      };
      subject.next(event);

      expect(res.write).toHaveBeenCalledWith(
        `event: progress\ndata: ${JSON.stringify(event)}\n\n`,
      );
    });

    it("maps StepStatus.Error to 'error' event type", () => {
      const subject = new ReplaySubject<any>();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      const event = {
        step: "scope_decomposition",
        status: StepStatus.Error,
        message: "Failed",
      };
      subject.next(event);

      expect(res.write).toHaveBeenCalledWith(
        `event: error\ndata: ${JSON.stringify(event)}\n\n`,
      );
    });

    it("maps StepStatus.Complete with empty step to 'complete' event type", () => {
      const subject = new ReplaySubject<any>();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      const event = { step: "", status: StepStatus.Complete, message: "Done" };
      subject.next(event);

      expect(res.write).toHaveBeenCalledWith(
        `event: complete\ndata: ${JSON.stringify(event)}\n\n`,
      );
    });

    it("calls res.end() on observable complete", () => {
      const subject = new ReplaySubject<any>();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);
      subject.complete();

      expect(res.end).toHaveBeenCalled();
    });

    it("unsubscribes on req close", () => {
      const subject = new ReplaySubject<any>();
      mockPipelineJobs.subscribe.mockReturnValue(subject.asObservable());
      const res = makeResMock();
      const req = makeReqMock();

      controller.streamProgress("job-1", req as any, res as any);

      const unsubscribeSpy = jest.spyOn(
        subject.asObservable().subscribe({}),
        "unsubscribe",
      );

      req._closeHandlers.forEach((h: Function) => h());

      expect(req.on).toHaveBeenCalledWith("close", expect.any(Function));
    });
  });
});
