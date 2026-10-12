import { afterEach, describe, expect, it } from 'vitest';
import { setFeatures } from '../../__tests__/helpers/features';
import { hasContent, linkLeadsSomewhere } from './content-presence';

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

describe('linkLeadsSomewhere', () => {
  afterEach(() => setFeatures());

  it('follows a page link to its feature, and its content', () => {
    const presence = { team: false, schedule: false, previousSpeakers: true };

    expect(linkLeadsSomewhere(presence, '/team')).toBe(false);
    expect(linkLeadsSomewhere(presence, '/team#organizers')).toBe(false);
    expect(linkLeadsSomewhere(presence, '/sessions/101')).toBe(false);
    expect(linkLeadsSomewhere(presence, '/schedule/my-schedule')).toBe(false);
    expect(linkLeadsSomewhere(presence, '/previous-speakers/ada')).toBe(true);
    expect(linkLeadsSomewhere({}, '/team')).toBe(true);
  });

  it('follows a page of a feature that is off nowhere', () => {
    setFeatures({ codeOfConduct: false });

    expect(linkLeadsSomewhere({}, '/coc')).toBe(false);
  });

  it('leaves other links alone', () => {
    expect(linkLeadsSomewhere({ team: false }, 'https://example.com/team')).toBe(true);
    expect(linkLeadsSomewhere({ team: false }, '//example.com/team')).toBe(true);
    expect(linkLeadsSomewhere({ team: false }, '/#subscribe')).toBe(true);
    expect(linkLeadsSomewhere({ team: false }, '/images/team.jpg')).toBe(true);
  });
});
