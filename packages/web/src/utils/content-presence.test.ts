import { describe, expect, it } from 'vitest';
import { hasContent } from './content-presence';

describe('hasContent', () => {
  it('hides only features the build found no content for', () => {
    const presence = { speakers: false, blog: true };

    expect(hasContent(presence, 'speakers')).toBe(false);
    expect(hasContent(presence, 'blog')).toBe(true);
    expect(hasContent(presence, 'attending')).toBe(true);
    expect(hasContent(presence, 'home')).toBe(true);
    expect(hasContent({}, 'speakers')).toBe(true);
  });

  it('hides My Schedule with the schedule', () => {
    expect(hasContent({ schedule: false }, 'mySchedule')).toBe(false);
    expect(hasContent({ schedule: true }, 'mySchedule')).toBe(true);
  });
});
