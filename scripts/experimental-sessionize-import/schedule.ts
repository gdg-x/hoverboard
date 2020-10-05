import moment from 'moment';
import data from '../../sessionize.json';
import { Schedule } from '../../src/models/schedule';
import { Timeslot } from '../../src/models/timeslot';
import { Track } from '../../src/models/track';
import { firestore } from '../firebase-config';
import { SessionizeSession } from './types';

export const importSchedule = async () => {
  const schedule: Schedule = await convertSchedule();
  const { length } = await save(schedule);
  console.log(`Imported data for ${length} day(s)`);
};

const convertTracks = (): Track[] => {
  return data.rooms.map(({ name, id }) => ({ title: name, sessionizeId: id }));
};

const getSessionids = async (): Promise<{ [id: string]: string }> => {
  const { docs } = await firestore.collection('sessions').get();
  const ids: { [id: string]: string } = {};

  docs.forEach((doc) => {
    const { sessionizeId } = doc.data() as SessionizeSession;
    ids[sessionizeId] = doc.id;
  });

  return ids;
};

const convertSchedule = async (): Promise<Schedule> => {
  const sessionIds = await getSessionids();
  const schedule: Schedule = {};

  for (const sessionData of data.sessions) {
    console.log(`Importing session ${sessionData.title} at ${sessionData.startsAt}`);
    const date = moment(sessionData.startsAt).format('YYYY-MM-DD');
    if (!schedule[date]) {
      schedule[date] = {
        date,
        dateReadable: moment(sessionData.startsAt).format('MMMM D'),
        timeslots: [],
        tracks: convertTracks(),
      };
    }
    const startTime = time(sessionData.startsAt);
    const existingTimeslot = schedule[date].timeslots.find((timeslot) => {
      return timeslot.startTime === startTime;
    });

    if (existingTimeslot) {
      existingTimeslot.sessions.push({
        items: [sessionIds[sessionData.id]],
      });
    } else {
      const timeslot: Timeslot = {
        endTime: time(sessionData.endsAt),
        startTime,
        sessions: [
          {
            items: [sessionIds[sessionData.id]],
          },
        ],
      };
      schedule[date].timeslots.push(timeslot);
    }
  }

  return schedule;
};

const time = (date: string): string => {
  return moment(date).format('HH:mm');
};

const save = (schedule: Schedule) => {
  const { length } = Object.keys(schedule);
  if (length === 0) {
    throw new Error('No schedule days found!');
  }
  console.log(`Importing ${length} day(s)...`);

  const batch = firestore.batch();

  Object.keys(schedule).forEach(async (date) => {
    batch.set(firestore.collection('schedule').doc(date), schedule[date]);
  });

  return batch.commit();
};
