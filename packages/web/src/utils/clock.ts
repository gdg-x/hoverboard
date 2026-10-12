import { readDemoTime } from './demo';

// Only a demo site's browser moves the clock, so the server and other sites read the real time.
const picked = __HB_FEATURES__.demo && typeof window !== 'undefined' ? readDemoTime() : null;
const offset = picked === null ? 0 : picked - Date.now();

/** The current time in milliseconds, for what depends on the event's dates. It keeps ticking. */
export const currentTime = (): number => Date.now() + offset;
