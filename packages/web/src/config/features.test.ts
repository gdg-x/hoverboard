import { describe, expect, it } from 'vitest';
import { COLLECTIONS } from '../../../storage/collections';
import { setFeatures } from '../../__tests__/helpers/features';
import { FEATURES, isFeature, isFeatureEnabled } from './features';

describe('features', () => {
  it('reads the flags from site.json', () => {
    for (const feature of FEATURES) {
      expect(isFeatureEnabled(feature)).toBe(true);
    }
  });

  it('reports features that are off', () => {
    setFeatures({ blog: false });

    expect(isFeatureEnabled('blog')).toBe(false);
    expect(isFeatureEnabled('team')).toBe(true);
  });

  it('recognizes feature names', () => {
    expect(isFeature('blog')).toBe(true);
    expect(isFeature('home')).toBe(false);
  });

  it.each(Object.entries(COLLECTIONS))(
    'knows the features of the %s collection in packages/storage',
    (_path, { features }) => {
      expect(features.filter((feature) => !isFeature(feature))).toEqual([]);
    },
  );
});
