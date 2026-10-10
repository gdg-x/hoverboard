import { msg } from '@lit/localize';
import type { NavigationRoute } from '../../config/features';

const LABELS: Record<NavigationRoute, () => string> = {
  home: () => msg('Home', { id: 'shell.nav.home' }),
  attending: () => msg('Attending', { id: 'shell.nav.attending' }),
  blog: () => msg('Blog', { id: 'shell.nav.blog' }),
  codeOfConduct: () => msg('Code of Conduct', { id: 'shell.nav.code-of-conduct' }),
  faq: () => msg('FAQs', { id: 'shell.nav.faq' }),
  mySchedule: () => msg('My Schedule', { id: 'shell.nav.my-schedule' }),
  previousSpeakers: () => msg('Previous Speakers', { id: 'shell.nav.previous-speakers' }),
  schedule: () => msg('Schedule', { id: 'shell.nav.schedule' }),
  speakers: () => msg('Speakers', { id: 'shell.nav.speakers' }),
  team: () => msg('Team', { id: 'shell.nav.team' }),
};

/** The label of a navigation entry in the current locale. Call it when rendering. */
export const navigationLabel = (route: NavigationRoute): string => LABELS[route]();
