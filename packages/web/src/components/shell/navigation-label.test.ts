import { describe, expect, it } from 'vitest';
import { NAVIGATION_ROUTES } from '../../config/features';
import { navigationLabel } from './navigation-label';

describe('navigationLabel', () => {
  it('labels every navigation route', () => {
    expect(NAVIGATION_ROUTES.map(navigationLabel)).toEqual([
      'Home',
      'Attending',
      'Blog',
      'Code of Conduct',
      'FAQs',
      'My Schedule',
      'Previous Speakers',
      'Schedule',
      'Speakers',
      'Team',
    ]);
  });
});
