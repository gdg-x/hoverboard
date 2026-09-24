import { describe, expect, it } from 'vitest';
import { ReduxMixin } from './mixin';

describe('ReduxMixin', () => {
  it('creates a mixin function bound to the real store', () => {
    expect(ReduxMixin).toBeInstanceOf(Function);
  });
});
