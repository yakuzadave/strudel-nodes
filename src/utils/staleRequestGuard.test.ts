import { describe, expect, it } from 'vitest';

import { createStaleRequestGuard } from './staleRequestGuard';

describe('createStaleRequestGuard', () => {
  it('creates sequential request handles that detect staleness when superseded', () => {
    const guard = createStaleRequestGuard();

    const first = guard.markNext();
    const second = guard.markNext();

    expect(first.id).toBeLessThan(second.id);
    expect(first.isStale()).toBe(true);
    expect(second.isStale()).toBe(false);
  });

  it('marks outstanding handles as stale when invalidated', () => {
    const guard = createStaleRequestGuard();
    const handle = guard.markNext();

    expect(handle.isStale()).toBe(false);

    guard.invalidate();

    expect(handle.isStale()).toBe(true);
  });

  it('correctly reports staleness for arbitrary request ids', () => {
    const guard = createStaleRequestGuard();
    const { id } = guard.markNext();

    expect(guard.isStale(id)).toBe(false);

    const newer = guard.markNext();

    expect(guard.isStale(id)).toBe(true);
    expect(guard.isStale(newer.id)).toBe(false);
  });
});
