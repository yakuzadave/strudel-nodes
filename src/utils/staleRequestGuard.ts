export interface StaleRequestHandle {
  readonly id: number;
  isStale(): boolean;
}

export interface StaleRequestGuard {
  markNext(): StaleRequestHandle;
  invalidate(): void;
  isStale(id: number): boolean;
  readonly latestId: number;
}

export function createStaleRequestGuard(initialId = 0): StaleRequestGuard {
  let latestId = initialId;

  return {
    markNext() {
      latestId += 1;
      const id = latestId;

      return {
        id,
        isStale: () => id !== latestId,
      } satisfies StaleRequestHandle;
    },
    invalidate() {
      latestId += 1;
    },
    isStale(id: number) {
      return id !== latestId;
    },
    get latestId() {
      return latestId;
    },
  } satisfies StaleRequestGuard;
}
