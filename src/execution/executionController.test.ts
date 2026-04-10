import { describe, expect, it, vi } from 'vitest';
import { ExecutionController, type RunResult } from './executionController';

const flushPromises = async () => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('ExecutionController', () => {
  it('runs queued requests serially with deterministic stop/evaluate order', async () => {
    const sequence: string[] = [];
    const evaluate = vi.fn(async (code: string) => {
      sequence.push(`eval:${code}`);
    });
    const stop = vi.fn(() => {
      sequence.push('stop');
    });

    const controller = new ExecutionController({ evaluate, stop });

    controller.enqueue({ id: '1', code: 's("bd")', mode: 'batch', requestedAt: 1 });
    controller.enqueue({ id: '2', code: 's("sd")', mode: 'batch', requestedAt: 2 });

    await flushPromises();

    expect(sequence).toEqual(['stop', 'eval:s("bd")', 'stop', 'eval:s("sd")']);
  });

  it('supports replaceLatest semantics by keeping only the newest queued run', async () => {
    let releaseFirst: (() => void) | undefined;
    const evaluate = vi.fn(
      (code: string) =>
        new Promise<void>((resolve) => {
          if (code === 'first') {
            releaseFirst = resolve;
            return;
          }
          resolve();
        })
    );
    const stop = vi.fn();

    const results: RunResult[] = [];
    const controller = new ExecutionController({ evaluate, stop, onRunResult: (result) => results.push(result) });

    controller.enqueue({ id: '1', code: 'first', mode: 'batch', requestedAt: 1 });
    controller.enqueue({ id: '2', code: 'stale', mode: 'batch', requestedAt: 2 });
    controller.replaceLatest({ id: '3', code: 'latest', mode: 'batch', requestedAt: 3 });

    releaseFirst?.();
    await flushPromises();

    expect(evaluate).toHaveBeenCalledTimes(2);
    expect(evaluate).toHaveBeenNthCalledWith(1, 'first');
    expect(evaluate).toHaveBeenNthCalledWith(2, 'latest');
    expect(results.map((result) => result.id)).toEqual(['1', '3']);
  });

  it('can cancel the current run', async () => {
    let releaseRun: (() => void) | undefined;
    const evaluate = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          releaseRun = resolve;
        })
    );
    const stop = vi.fn();

    const results: RunResult[] = [];
    const controller = new ExecutionController({ evaluate, stop, onRunResult: (result) => results.push(result) });

    controller.enqueue({ id: '1', code: 'long', mode: 'batch', requestedAt: 1 });
    await Promise.resolve();

    controller.cancelCurrent();
    releaseRun?.();
    await flushPromises();

    expect(stop).toHaveBeenCalledTimes(2);
    expect(results.at(-1)?.status).toBe('cancelled');
  });

  it('skips duplicate runs based on code/settings hash', async () => {
    const evaluate = vi.fn(async () => undefined);
    const stop = vi.fn();

    const results: RunResult[] = [];
    const controller = new ExecutionController({ evaluate, stop, onRunResult: (result) => results.push(result) });

    const request = { id: '1', code: 's("bd")', mode: 'live' as const, requestedAt: 1, settingsHash: 'x' };
    controller.enqueue(request);
    controller.enqueue({ ...request, id: '2', requestedAt: 2 });

    await flushPromises();

    expect(evaluate).toHaveBeenCalledTimes(1);
    expect(results[0]?.status).toBe('completed');
    expect(results[1]?.status).toBe('skipped');
  });
});
