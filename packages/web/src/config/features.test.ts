import { describe, expect, it } from 'vitest';
import { FEATURES, isFeature, isFeatureEnabled } from './features';

describe('features', () => {
  it('turns every feature on', () => {
    for (const feature of FEATURES) {
      expect(isFeatureEnabled(feature)).toBe(true);
    }
  });

  it('recognizes feature names', () => {
    expect(isFeature('blog')).toBe(true);
    expect(isFeature('home')).toBe(false);
  });
});
