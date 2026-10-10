import { msg } from '@lit/localize';
import { attendingPage } from '../config/site';

export type Page =
  | 'attending'
  | 'blog'
  | 'coc'
  | 'faq'
  | 'notFound'
  | 'offline'
  | 'previousSpeakers'
  | 'schedule'
  | 'speakers'
  | 'team';

interface PageText {
  title: string;
  /** For the description meta tag. The visible hero description is site content. */
  metaDescription: string;
}

const PAGES: Record<Page, () => PageText> = {
  attending: () => ({
    title: msg('Attending', { id: 'pages.attending.title' }),
    metaDescription:
      attendingPage?.description ??
      msg('How to get to the event, and how to join online', {
        id: 'pages.attending.description',
      }),
  }),
  blog: () => ({
    title: msg('Blog', { id: 'pages.blog.title' }),
    metaDescription: msg('Read stories from our team', { id: 'pages.blog.description' }),
  }),
  coc: () => ({
    title: msg('Code of Conduct', { id: 'pages.coc.title' }),
    metaDescription: msg(
      'Learn more about our expectations for all those who participate in our community',
      { id: 'pages.coc.description' },
    ),
  }),
  faq: () => ({
    title: msg('FAQs', { id: 'pages.faq.title' }),
    metaDescription: msg('Find you answer right here!', { id: 'pages.faq.description' }),
  }),
  notFound: () => ({
    title: msg('Not Found', { id: 'pages.not-found.title' }),
    metaDescription: msg('Page not found', { id: 'pages.not-found.description' }),
  }),
  offline: () => ({
    title: msg('Offline', { id: 'pages.offline.title' }),
    metaDescription: msg('This page is not available offline', {
      id: 'pages.offline.description',
    }),
  }),
  previousSpeakers: () => ({
    title: msg('Previous Speakers', { id: 'pages.previous-speakers.title' }),
    metaDescription: msg('Check who was with us last years', {
      id: 'pages.previous-speakers.description',
    }),
  }),
  schedule: () => ({
    title: msg('Schedule', { id: 'pages.schedule.title' }),
    metaDescription: msg('Choose your sessions to visit', { id: 'pages.schedule.description' }),
  }),
  speakers: () => ({
    title: msg('Speakers', { id: 'pages.speakers.title' }),
    metaDescription: msg(
      'Hear from the Googlers, Partners, and Guest Speakers who are building the future of cloud. Check back often as we add more speakers, including our customers and partners.',
      { id: 'pages.speakers.description' },
    ),
  }),
  team: () => ({
    title: msg('Team', { id: 'pages.team.title' }),
    metaDescription: msg('Get more info about organizers', { id: 'pages.team.description' }),
  }),
};

/** A page's title and meta description in the current locale. Call it when rendering. */
export const pageText = (page: Page): PageText => PAGES[page]();
