import { msg } from '@lit/localize';
import { featuredVideos, galleryBlock, stream } from '../../config/site';
import type { NextStep } from '../../utils/next-step';
import { navigationLabel } from '../shell/navigation-label';

export interface NextStepLink {
  href: string;
  label: string;
  icon: string;
  /** Opens in a new tab. */
  external: boolean;
}

/** Where a next step goes, and its label in the current locale. Call it when rendering. */
export const nextStepLink = (step: NextStep, ticketUrl = ''): NextStepLink => {
  switch (step) {
    case 'tickets':
      return {
        href: ticketUrl,
        label: msg('Buy ticket', { id: 'common.buy-ticket' }),
        icon: 'ticket',
        external: true,
      };
    case 'watchLive':
      return {
        href: stream ?? '',
        label: msg('Watch live', { id: 'common.watch-live' }),
        icon: 'monitor',
        external: true,
      };
    case 'onNow':
      return {
        href: '/schedule',
        label: msg("See what's on now", { id: 'home.hero.live-schedule' }),
        icon: 'calendar',
        external: false,
      };
    case 'schedule':
      return {
        href: '/schedule',
        label: navigationLabel('schedule'),
        icon: 'calendar',
        external: false,
      };
    case 'updates':
      return {
        href: '/#subscribe',
        label: msg('Get updates', { id: 'common.get-updates' }),
        icon: 'bell-outline',
        external: false,
      };
    case 'videos':
      return {
        href: featuredVideos.callToAction.link,
        label: msg('Watch the videos', { id: 'home.hero.videos' }),
        icon: 'movie',
        external: true,
      };
    case 'photos':
      return {
        href: galleryBlock.callToAction.link,
        label: msg('See the photos', { id: 'home.hero.photos' }),
        icon: 'people',
        external: true,
      };
  }
};
