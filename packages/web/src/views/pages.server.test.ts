import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it } from 'vitest';
import { seedPage } from '../data/page';
import type { Day } from '../models/day';
import type { Session } from '../models/session';
import type { SpeakerWithTags } from '../models/speaker';
import type { RouteLocation } from '../router';
import '../components/home/speakers-block';
import '../components/shared/add-to-calendar';
import './faq-page';
import './schedule-page';
import './schedule/schedule-day';
import './speakers-page';

const renderToString = async (template: TemplateResult) =>
  // Comments are Lit's hydration markers.
  (await collectResult(render(template))).replace(/<!--[^>]*-->/g, '');

const speakers = ['ada', 'grace', 'alan'].map((id) => ({
  id,
  name: id,
  featured: true,
  socials: [{ icon: 'github', link: `https://github.com/${id}`, name: 'GitHub' }],
  badges: [{ name: 'gde', link: 'https://developers.google.com', description: 'GDE' }],
  tags: [],
})) as never as SpeakerWithTags[];

const session = {
  id: 's1',
  title: 'Hydration',
  description: '',
  day: '2026-10-08',
  startTime: '10:00',
  endTime: '11:00',
  speakers: [],
  tags: [],
} as never as Session;

const day: Day = {
  date: '2026-10-08',
  dateReadable: 'October 8',
  tracks: [{ title: 'Main' }],
  timeslots: [
    {
      startTime: '10:00',
      endTime: '11:00',
      sessions: [{ items: [session], gridArea: '1 / 2 / 2 / 3' } as never],
    },
  ],
};

const location: RouteLocation = {
  pathname: '/schedule/2026-10-08',
  search: '',
  params: { id: '2026-10-08' },
};

describe('pages on the server', () => {
  it('render the FAQ with its table of contents from the given content', async () => {
    seedPage({});

    const page = await renderToString(
      html`<faq-page .content=${'## Venue\n\nDetails.\n\n### Parking'}></faq-page>`,
    );

    expect(page).toContain('<h2 id="venue">Venue</h2>');
    expect(page).toContain('href="/faq#parking"');
    expect(page).toContain('<p>Details.</p>');
  });

  it("render the schedule day from the location's date", async () => {
    seedPage({ schedule: [day], sessions: [session], speakers: [] });

    const page = await renderToString(
      html`<schedule-page .location=${location}
        ><schedule-day .location=${location}></schedule-day
      ></schedule-page>`,
    );

    expect(page).toContain('October 8');
    expect(page).toContain('href="/schedule/2026-10-08#10:00"');
  });

  it('render speaker cards without links in links, which do not hydrate', async () => {
    seedPage({ speakers, sessions: [], previousSpeakers: [] });

    const page = await renderToString(html`<speakers-page></speakers-page>`);

    expect(page).toMatch(
      /<a\s+class="speaker-link"\s+href="\/speakers\/ada"\s+aria-label="ada"\s*><\/a>/,
    );
    expect(page).not.toMatch(/<a\s+class="speaker /);
  });

  it('render featured speakers in their stored order, so hydration matches', async () => {
    seedPage({ speakers });

    const pages = await Promise.all(
      [1, 2, 3].map(() => renderToString(html`<speakers-block></speakers-block>`)),
    );

    expect(new Set(pages).size).toBe(1);
    expect(pages[0]!.indexOf('/speakers/ada')).toBeLessThan(pages[0]!.indexOf('/speakers/grace'));
    expect(pages[0]!.indexOf('/speakers/grace')).toBeLessThan(pages[0]!.indexOf('/speakers/alan'));
  });

  it('render the calendar button without its menu, which does not hydrate', async () => {
    const page = await renderToString(
      html`<add-to-calendar .session=${session}></add-to-calendar>`,
    );

    expect(page).toContain('<md-outlined-button');
    expect(page).not.toContain('<md-menu');
  });
});
