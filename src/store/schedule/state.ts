import { Initialized, RemoteData } from '@abraham/remotedata';
import { Schedule } from '../../models/schedule';

export type ScheduleState = RemoteData<Error, Schedule[]>;
export const initialScheduleState: ScheduleState = new Initialized();
