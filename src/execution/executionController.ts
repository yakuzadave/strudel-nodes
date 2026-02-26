export type RunMode = 'batch' | 'live';

export interface RunRequest {
  id: string;
  code: string;
  requestedAt: number;
  mode: RunMode;
  settingsHash?: string;
  label?: string;
}

export type RunStatus = 'completed' | 'failed' | 'cancelled' | 'skipped';

export interface RunResult {
  id: string;
  status: RunStatus;
  startedAt: number;
  finishedAt: number;
  mode: RunMode;
  label?: string;
  error?: unknown;
}

export interface ExecutionControllerOptions {
  evaluate: (code: string) => Promise<unknown>;
  stop: () => void;
  now?: () => number;
  onRunResult?: (result: RunResult) => void;
}

const createRequestHash = (request: RunRequest) => `${request.code}::${request.settingsHash ?? ''}`;

export class ExecutionController {
  private readonly evaluate: (code: string) => Promise<unknown>;
  private readonly stop: () => void;
  private readonly now: () => number;
  private readonly onRunResult?: (result: RunResult) => void;

  private queue: RunRequest[] = [];
  private isProcessing = false;
  private runToken = 0;
  private currentRunToken: number | null = null;
  private lastSuccessfulHash: string | null = null;

  constructor(options: ExecutionControllerOptions) {
    this.evaluate = options.evaluate;
    this.stop = options.stop;
    this.now = options.now ?? Date.now;
    this.onRunResult = options.onRunResult;
  }

  enqueue(request: RunRequest) {
    this.queue.push(request);
    this.processQueue();
  }

  replaceLatest(request: RunRequest) {
    this.queue = [request];
    this.processQueue();
  }

  clearQueue() {
    this.queue = [];
  }

  cancelCurrent() {
    if (this.currentRunToken !== null) {
      this.runToken += 1;
      this.currentRunToken = null;
      this.stop();
    }
  }

  getQueueSnapshot() {
    return [...this.queue];
  }

  private emit(result: RunResult) {
    this.onRunResult?.(result);
  }

  private async processQueue() {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (!next) {
        continue;
      }

      const hash = createRequestHash(next);
      const startedAt = this.now();

      if (hash === this.lastSuccessfulHash) {
        this.emit({
          id: next.id,
          status: 'skipped',
          mode: next.mode,
          label: next.label,
          startedAt,
          finishedAt: this.now(),
        });
        continue;
      }

      const token = this.runToken + 1;
      this.runToken = token;
      this.currentRunToken = token;

      try {
        // Ensure deterministic playback transitions.
        this.stop();
        await this.evaluate(next.code);

        if (this.currentRunToken !== token) {
          this.emit({
            id: next.id,
            status: 'cancelled',
            mode: next.mode,
            label: next.label,
            startedAt,
            finishedAt: this.now(),
          });
          continue;
        }

        this.lastSuccessfulHash = hash;
        this.emit({
          id: next.id,
          status: 'completed',
          mode: next.mode,
          label: next.label,
          startedAt,
          finishedAt: this.now(),
        });
      } catch (error) {
        if (this.currentRunToken !== token) {
          this.emit({
            id: next.id,
            status: 'cancelled',
            mode: next.mode,
            label: next.label,
            startedAt,
            finishedAt: this.now(),
          });
          continue;
        }

        this.emit({
          id: next.id,
          status: 'failed',
          mode: next.mode,
          label: next.label,
          startedAt,
          finishedAt: this.now(),
          error,
        });
      } finally {
        if (this.currentRunToken === token) {
          this.currentRunToken = null;
        }
      }
    }

    this.isProcessing = false;
  }
}

export const createRunRequest = (
  code: string,
  mode: RunMode,
  partial: Partial<Pick<RunRequest, 'label' | 'settingsHash'>> = {}
): RunRequest => ({
  id: `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  code,
  mode,
  requestedAt: Date.now(),
  label: partial.label,
  settingsHash: partial.settingsHash,
});
