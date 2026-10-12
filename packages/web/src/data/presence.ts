import type { Feature } from '../config/features';
import type { Content } from '../store/content';
import type { ContentPresence } from '../utils/content-presence';
import { buildContentSchedule } from './schedule';

// The content each feature's pages and home block show. The schedule is checked by its days.
const FEATURE_CONTENT = {
  blog: 'blog',
  gallery: 'gallery',
  partners: 'partners',
  previousSpeakers: 'previousSpeakers',
  speakers: 'speakers',
  team: 'members',
  tickets: 'tickets',
  videos: 'videos',
} as const satisfies Partial<Record<Feature, keyof Content>>;

const cache = new WeakMap<Partial<Content>, ContentPresence>();

/**
 * Which features have content, from the build's content. Features that are off have no key. The
 * schedule needs days, which an unpublished schedule or sessions without times don't have.
 */
export const contentPresence = (content: Partial<Content>): ContentPresence => {
  const cached = cache.get(content);
  if (cached) return cached;
  const presence: ContentPresence = Object.fromEntries(
    Object.entries(FEATURE_CONTENT).flatMap(([feature, name]) => {
      const docs = content[name];
      return docs ? [[feature, docs.length > 0]] : [];
    }),
  );
  if (content.sessions) {
    presence.schedule = buildContentSchedule(content).schedule.length > 0;
  }
  cache.set(content, presence);
  return presence;
};
