import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { confirmChange } from '../lib/prompt.js';
import { siteConfigPath } from './firebase-project.js';

const DAY_MS = 86_400_000;

interface EventDates {
  startDate: string;
  endDate: string;
  timezone: string;
}

const eventOf = (repoRoot: string): EventDates | undefined => {
  const path = join(repoRoot, siteConfigPath(repoRoot));
  if (!existsSync(path)) return undefined;
  const event = (JSON.parse(readFileSync(path, 'utf8')) as { event?: Partial<EventDates> }).event;
  return event?.startDate && event.endDate && event.timezone ? (event as EventDates) : undefined;
};

/** Whether `now` is from a week before the event's first day to its last, in its time zone. */
export const inEventWeek = ({ startDate, endDate, timezone }: EventDates, now: Date): boolean => {
  // `en-CA` writes dates as YYYY-MM-DD, which compare as strings.
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now);
  const weekBefore = new Date(Date.parse(`${startDate}T00:00:00Z`) - 7 * DAY_MS)
    .toISOString()
    .slice(0, 10);
  return today >= weekBefore && today <= endDate;
};

/**
 * Warns in the week of the event, when an upgrade could break the site attendees need, and asks
 * whether to go on. A dry run only warns. Returns whether to go on.
 */
export const confirmUpgradeTiming = async (
  repoRoot: string,
  { yes = false, dryRun = false, now = new Date() } = {},
): Promise<boolean> => {
  const event = eventOf(repoRoot);
  if (!event || !inEventWeek(event, now)) return true;
  console.log(
    `! The event is on ${event.startDate} to ${event.endDate}. An upgrade now could break the ` +
      'site when attendees need it most. Upgrade after the event, unless it fixes a problem you have.\n',
  );
  if (dryRun) return true;
  if (await confirmChange('Upgrade anyway?', yes)) return true;
  console.log('Aborted.');
  return false;
};
