import { Initialized, RemoteData } from '@abraham/remotedata';
import { Day } from '../../models/day';

export type ScheduleState = RemoteData<Error, Day[]>;
export const initialScheduleState: ScheduleState = new Initialized();
