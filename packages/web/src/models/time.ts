import { Session } from './session';

interface TimeData {
  extend?: number;
  items: string[];
}

interface TimeWithSessions {
  extend?: number;
  items: Session[];
}

export type Time = TimeData | TimeWithSessions;

// The `generatedSchedule` collection produced by the schedule generator (see
// `packages/server/functions/src/schedule-generator/speakers-sessions-schedule-map.ts`) resolves
// `items` to full `Session` objects and adds a computed CSS `gridArea` that isn't
// present on the raw `schedule` seed data modeled by `Time` above.
export type GeneratedSessionBlock = TimeWithSessions & { gridArea: string };
