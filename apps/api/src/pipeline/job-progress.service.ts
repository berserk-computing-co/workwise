import { Injectable } from "@nestjs/common";
import { ReplaySubject, Observable } from "rxjs";

export interface ProgressEvent {
  step: string;
  status: "running" | "complete" | "error";
  message: string;
  projectId?: string;
  total?: number;
}

@Injectable()
export class JobProgressService {
  private readonly subjects = new Map<string, ReplaySubject<ProgressEvent>>();

  createJob(jobId: string): void {
    this.subjects.set(jobId, new ReplaySubject<ProgressEvent>(10));
  }

  emit(jobId: string, event: ProgressEvent): void {
    const subject = this.subjects.get(jobId);
    if (subject) {
      subject.next(event);
    }
  }

  subscribe(jobId: string): Observable<ProgressEvent> | null {
    const subject = this.subjects.get(jobId);
    return subject?.asObservable() ?? null;
  }

  complete(jobId: string): void {
    const subject = this.subjects.get(jobId);
    if (subject) {
      subject.complete();
      setTimeout(() => this.subjects.delete(jobId), 30_000);
    }
  }

  error(jobId: string, event: ProgressEvent): void {
    this.emit(jobId, event);
    this.complete(jobId);
  }

  has(jobId: string): boolean {
    return this.subjects.has(jobId);
  }
}
