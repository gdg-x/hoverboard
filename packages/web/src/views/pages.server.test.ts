import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it } from 'vitest';
import { seedPage } from '../data/page';
import type { Day } from '../models/day';
import type { Session } from '../models/session';
import type { SpeakerWithTags } from '../models/speaker';
import type { Ticket } from '../models/ticket';
import type { RouteLocation } from '../utils/navigation';
import '../components/home/speakers-block';
import '../components/shared/add-to-calendar';
import '../components/shell/app-header';
import './faq-page';
import './home-page';
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

    expect(page).toContain('aria-label="Schedule for October 8"');
    expect(page).toContain('href="/sessions/s1"');
    expect(page).toMatch(/aria-current="page"[^>]*data-day="2026-10-08"/);
  });

  it('render speaker cards without links in links, which do not hydrate', async () => {
    seedPage({ speakers, sessions: [], previousSpeakers: [] });

    const page = await renderToString(html`<speakers-page></speakers-page>`);

    expect(page).toMatch(/<hb-card\s+href="\/speakers\/ada"\s+label="ada"/);
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

  it('render the home hero for the build-time event state', async () => {
    seedPage({ speakers: [], blog: [] });

    const page = await renderToString(
      html`<home-page event-state="upcoming" days-to-go="12"></home-page>`,
    );

    expect(page).toMatch(/<h1\s+id="hero-title"\s+class="title"\s*>/);
    expect(page).toContain('12 days to go');
    expect(page).toMatch(/<about-block\s+class="band"/);
  });

  it('render the calendar button with its closed menu', async () => {
    const page = await renderToString(
      html`<add-to-calendar .session=${session}></add-to-calendar>`,
    );

    expect(page).toMatch(/<hb-button\s+slot="trigger"\s+variant="outlined"/);
    expect(page).toMatch(/<a\s+role="menuitem"\s+href="https:\/\/calendar\.google\.com/);
    expect(page).toMatch(/popover="manual"\s+role="menu"/);
  });

  it("render the header with the page's link marked as current, and the build's event state", async () => {
    seedPage({
      tickets: [{ name: 'Regular', url: 'https://example.com/t', available: true }] as Ticket[],
    });

    const upcoming = await renderToString(
      html`<app-header path="/speakers/ada" .eventState=${'upcoming'}></app-header>`,
    );
    const over = await renderToString(
      html`<app-header path="/speakers/ada" .eventState=${'over'}></app-header>`,
    );

    expect(upcoming).toMatch(/<a\s+href="\/speakers"\s+aria-current="page"/);
    expect(upcoming).toMatch(/<hb-button[^>]*class="cta"[^>]*href="https:\/\/example\.com\/t"/);
    const overCallToAction = over.match(/<hb-button[^>]*variant="cta"[^>]*>/)?.[0];
    expect(overCallToAction).toContain('href="/schedule"');
    expect(overCallToAction).toContain('class="cta in-nav"');
  });
});
