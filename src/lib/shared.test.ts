import { describe, expect, it } from 'vitest';
import { experimentSchema } from './shared';

describe('Shared with API', () => {
  it('Has working experiment schema', () => {
    expect(experimentSchema.safeParse({}).success).toBe(false);

    expect(
      experimentSchema.safeParse({
        name: 'name',
        type: 'HARDWARE',
        code: 'code',
        tests: 'tests',
        compare: 'compare',
        visibility: 'PRIVATE',
      }).success,
    ).toBe(true);
  });
});
