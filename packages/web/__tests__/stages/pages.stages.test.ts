import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { JSDOM } from 'jsdom';
import { html, type TemplateResult } from 'lit';
import { afterAll, beforeAll, describe, expect, inject, it, vi } from 'vitest';
import { STAGE_FIXTURES, type StageFixtureName, fixtureDocuments } from '../fixtures/stages';
import { nextStepLink } from '../../src/components/shared/next-step-link';
import {
  archive,
  callForPapers,
  eventDates,
  scheduleOptions,
  timeZone,
} from '../../src/config/site';
import type { Feature } from '../../src/config/features';
import { readContent } from '../../src/data/content';
import { seedPage } from '../../src/data/page';
import { contentPresence } from '../../src/data/presence';
import { sampleDocuments, sampleFirestore } from '../../src/data/sample';
import { buildSchedule } from '../../src/schedule/build-schedule';
import type { Content } from '../../src/store/content';
import { daysUntilStart, eventState } from '../../src/utils/event-state';
import type { NextStep } from '../../src/utils/next-step';
import { siteStages } from '../../src/utils/stages';
import type { RouteLocation } from '../../src/utils/navigation';
import '../../src/components/footer/footer-block';
import '../../src/components/shell/app-header';
import { homeBlocks } from '../../src/views/home-page';
import '../../src/views/schedule-page';
import '../../src/views/schedule/schedule-day';
import '../../src/views/speakers-page';

declare module 'vitest' {
  export interface ProvidedContext {
    stageFixture: StageFixtureName;
  }
}

const name = inject('stageFixture');
const fixture = STAGE_FIXTURES[name];
const time = Date.parse(fixture.time);
const event = { startDate: eventDates.start, endDate: eventDates.end, timezone: timeZone };
const state = eventState(new Date(time), event);

// The hero's class for each step's button.
const STEP_CLASSES: Record<NextStep, string> = {
  submitTalk: 'submit-talk',
  tickets: 'buy-ticket',
  watchLive: 'watch-live',
  onNow: 'schedule',
  attending: 'attending',
  schedule: 'schedule',
  updates: 'updates',
  videos: 'videos',
  photos: 'photos',
};

// The home page's band for each feature, and the content it shows.
const BANDS: [Feature, string, keyof Content][] = [
  ['speakers', 'speakers-block', 'speakers'],
  ['tickets', 'tickets-block', 'tickets'],
  ['gallery', 'gallery-block', 'gallery'],
  ['videos', 'featured-videos', 'videos'],
  ['blog', 'latest-posts-block', 'blog'],
  ['partners', 'partners-block', 'partners'],
];

// The pages each internal link prefix leads to.
const PAGES: [string, Feature][] = [
  ['/speakers', 'speakers'],
  ['/schedule', 'schedule'],
  ['/sessions', 'schedule'],
  ['/previous-speakers', 'previousSpeakers'],
  ['/team', 'team'],
  ['/blog', 'blog'],
  ['/attending', 'attending'],
  ['/faq', 'faq'],
  ['/coc', 'codeOfConduct'],
];

/** Elements matching `selector`, in the light DOM and every declarative shadow root under it. */
const all = (root: ParentNode, selector: string): Element[] => [
  ...root.querySelectorAll(selector),
  ...[...root.querySelectorAll('template')].flatMap((template) =>
    all((template as HTMLTemplateElement).content, selector),
  ),
];

/** The contents of an element's declarative shadow root. */
const shadow = (element: Element): DocumentFragment =>
  (element.querySelector(':scope > template') as HTMLTemplateElement).content;

const renderPage = async (template: TemplateResult) =>
  new JSDOM(await collectResult(render(template))).window.document;

const textOf = (root: ParentNode) =>
  all(root, '*')
    .map((element) => [...element.childNodes].filter((node) => node.nodeType === 3))
    .flat()
    .map((node) => node.textContent)
    .join(' ')
    .replace(/\s+/g, ' ');

let content: Partial<Content>;
let header: Document;
let footer: Document;
let home: Document;
let speakers: Document;
let schedule: Document;

beforeAll(async () => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(time);
  await homeBlocks;
  content = await readContent(sampleFirestore(fixtureDocuments(fixture, sampleDocuments())));
  const presence = contentPresence(content);
  // As the home page's route does, which seeds the tickets even with the feature off.
  seedPage({ ...content, tickets: content.tickets ?? [] });

  header = await renderPage(
    html`<app-header
      path="/"
      .eventState=${state}
      .time=${time}
      .presence=${presence}
    ></app-header>`,
  );
  footer = await renderPage(html`<footer-block></footer-block>`);
  home = await renderPage(
    html`<home-page
      event-state=${state}
      days-to-go=${daysUntilStart(new Date(time), event)}
      .time=${time}
      .presence=${presence}
    ></home-page>`,
  );
  speakers = await renderPage(html`<speakers-page></speakers-page>`);
  const location: RouteLocation = { pathname: '/schedule', search: '', params: {} };
  schedule = await renderPage(
    html`<schedule-page .location=${location}
      ><schedule-day .location=${location}></schedule-day
    ></schedule-page>`,
  );
});

afterAll(() => {
  vi.useRealTimers();
});

describe(`the ${name} fixture`, () => {
  const has = (feature: Feature, key: keyof Content) =>
    __HB_FEATURES__[feature] && (content[key]?.length ?? 0) > 0;
  const scheduleDays = () =>
    buildSchedule(
      { sessions: content.sessions ?? [], speakers: content.speakers ?? [] },
      scheduleOptions,
    ).schedule.length > 0;

  it(`is in its stages at ${fixture.time}`, () => {
    expect(
      siteStages(time, {
        event,
        callForPapers,
        tickets: content.tickets ?? [],
        schedule: __HB_FEATURES__.schedule && scheduleDays(),
        archived: !!archive,
      }).stages,
    ).toEqual(fixture.stages);
  });

  it(`offers ${fixture.steps.join(', ') || 'no step'} in the hero`, () => {
    const hero = shadow(all(home, 'home-hero')[0]!);
    const buttons = [...hero.querySelectorAll('.actions > hb-button')].map(
      (button) => button.className,
    );
    const steps = fixture.steps.slice(0, 2).map((step) => STEP_CLASSES[step]);

    expect(buttons).toEqual(steps.length < 2 ? [...steps, 'watch-video'] : steps);
    expect(hero.querySelector('.actions > add-to-calendar') !== null).toBe(state === 'upcoming');
  });

  it('offers the first step in the header', () => {
    const [step] = fixture.steps;
    const cta = all(header, 'hb-button.cta')[0];

    expect(cta?.getAttribute('href')).toBe(
      step ? nextStepLink(step, content.tickets?.[0]?.url).href : undefined,
    );
  });

  it('shows the bands with content, and only them', () => {
    const bands = shadow(all(home, 'home-page')[0]!);

    for (const [feature, tag, key] of BANDS) {
      const shown = has(feature, key) && !(feature === 'tickets' && state === 'over');
      expect(bands.querySelector(tag) !== null, tag).toBe(shown);
    }
    expect(all(home, 'h1')).toHaveLength(1);
  });

  it('links only to pages that are on and have content', () => {
    const presence = contentPresence(content);
    const links = [header, home, footer]
      .flatMap((document) => all(document, '[href]'))
      .map((element) => element.getAttribute('href')!)
      .filter((href) => href.startsWith('/') && !href.startsWith('//'));
    const broken = links.filter((href) => {
      const feature = PAGES.find(
        ([prefix]) =>
          href === prefix || href.startsWith(`${prefix}/`) || href.startsWith(`${prefix}#`),
      )?.[1];
      return feature && !(__HB_FEATURES__[feature] && presence[feature] !== false);
    });

    expect(broken).toEqual([]);
  });

  it('says the speakers and the schedule are coming soon until they are out', () => {
    expect(textOf(speakers).includes('Speakers are coming soon.')).toBe(
      !has('speakers', 'speakers'),
    );
    expect(textOf(schedule).includes('The schedule is coming soon.')).toBe(
      __HB_FEATURES__.schedule && !scheduleDays(),
    );
  });
});
