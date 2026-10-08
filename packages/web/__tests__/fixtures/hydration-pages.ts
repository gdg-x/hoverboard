import { html, type TemplateResult } from 'lit';
import type { Day } from '../../src/models/day';
import type { Post } from '../../src/models/post';
import type { PreviousSpeaker } from '../../src/models/previous-speaker';
import type { Session } from '../../src/models/session';
import type { SpeakerWithTags } from '../../src/models/speaker';
import type { Content } from '../../src/store/content';
import type { RouteLocation } from '../../src/utils/navigation';

/** A page that the Hydration project renders with Lit SSR, then hydrates in jsdom. */
export interface HydrationPage {
  content: Partial<Content>;
  /** Defines the page's elements. Pages import some blocks without waiting, so wait for them. */
  load: () => Promise<unknown>;
  template: () => TemplateResult;
}

const speakers = ['ada', 'grace', 'alan', 'barbara', 'edsger'].map((id, index) => ({
  id,
  name: id,
  featured: index < 4,
  photoUrl: `https://example.com/${id}.jpg`,
  company: 'Example',
  companyLogoUrl: 'https://example.com/logo.svg',
  country: 'Ukraine',
  bio: `**${id}** builds things.`,
  socials: [{ icon: 'github', link: `https://github.com/${id}`, name: 'GitHub' }],
  badges: [{ name: 'gde', link: 'https://developers.google.com', description: 'GDE' }],
  tags: [],
})) as never as SpeakerWithTags[];

const previousSpeakers = Array.from({ length: 16 }, (_, index) => ({
  id: `previous-${index}`,
  name: `Previous ${index}`,
  photoUrl: `https://example.com/previous-${index}.jpg`,
  socials: [],
  sessions: {},
})) as never as PreviousSpeaker[];

const session = {
  id: 's1',
  title: 'Hydration',
  description: 'Matching **server** HTML.',
  day: '2026-10-08',
  startTime: '10:00',
  endTime: '11:00',
  speakers: [],
  tags: ['Web'],
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

const post = {
  id: 'hello',
  title: 'Hello',
  brief: 'The first post.',
  content: 'Hello **world**.',
  published: '2026-10-01',
  image: 'https://example.com/post.jpg',
} as never as Post;

const location: RouteLocation = {
  pathname: '/schedule/2026-10-08',
  search: '',
  params: { id: '2026-10-08' },
};

export const HYDRATION_PAGES: Record<string, HydrationPage> = {
  'header and footer': {
    content: { tickets: [] },
    load: () =>
      Promise.all([
        import('../../src/components/shell/app-header'),
        import('../../src/components/footer/footer-block'),
      ]),
    template: () =>
      html`<app-header .path=${'/speakers'}></app-header><footer-block></footer-block>`,
  },
  'home page': {
    content: { blog: [post], speakers },
    load: () =>
      Promise.all([
        import('../../src/views/home-page'),
        import('../../src/components/home/fork-me-block'),
        import('../../src/components/home/latest-posts-block'),
        import('../../src/components/home/speakers-block'),
        import('../../src/components/home/subscribe-block'),
      ]),
    template: () => html`<home-page></home-page>`,
  },
  'speakers page': {
    content: { speakers, sessions: [session], previousSpeakers },
    load: () => import('../../src/views/speakers-page'),
    template: () => html`<speakers-page></speakers-page>`,
  },
  'speaker page': {
    content: { speakers, previousSpeakers },
    load: () => import('../../src/views/speaker-page'),
    template: () => html`<speaker-page .speakerId=${'ada'}></speaker-page>`,
  },
  'session page': {
    content: { sessions: [session] },
    load: () => import('../../src/views/session-page'),
    template: () => html`<session-page .sessionId=${'s1'}></session-page>`,
  },
  'schedule day': {
    content: { schedule: [day], sessions: [session], speakers },
    load: () =>
      Promise.all([
        import('../../src/views/schedule-page'),
        import('../../src/views/schedule/schedule-day'),
      ]),
    template: () =>
      html`<schedule-page .location=${location}
        ><schedule-day .location=${location}></schedule-day
      ></schedule-page>`,
  },
  'blog post': {
    content: { blog: [post] },
    load: () => import('../../src/views/post-page'),
    template: () => html`<post-page .postId=${'hello'}></post-page>`,
  },
  'FAQ page': {
    content: {},
    load: () => import('../../src/views/faq-page'),
    template: () =>
      html`<faq-page .content=${'## Venue\n\nDetails.\n\n### Parking\n\nNearby.'}></faq-page>`,
  },
};
