// https://github.com/import-js/eslint-plugin-import/issues/1810

import type { MulticastMessage } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { fetchConfig } from '../db/config.js';
import { isFeatureOff } from '../features.js';
import { getSiteConfig } from '../site-config.js';
import { fetchFeaturedSessions } from '../db/featured-sessions.js';
import { fetchNotificationsUser, removeUserTokens } from '../db/notifications-users.js';
import { claimSentNotification, releaseSentNotification } from '../db/sent-notifications.js';
import { fetchSessionsOn } from '../db/sessions.js';
import {
  createTimeWindow,
  filterUpcoming,
  getTodayDateString,
  parseTimeAndGetFromNow,
} from '../time.js';
import { isInvalidTokenError, sendToTokens } from '../utils/messaging.js';
import { logId } from '../utils/log-id.js';

const sendPushNotificationToUsers = async (userIds: string[], data: MulticastMessage['data']) => {
  logger.log(`Sending the reminder for ${data?.['path']} to ${userIds.length} users.`);

  const usersSnapshots = await Promise.all(userIds.map((id) => fetchNotificationsUser(id)));

  // `notificationsUsers/{userId}` is `{ tokens: { [deviceToken]: true } }`.
  const tokensToUsers: Record<string, string> = {};
  usersSnapshots.forEach((snapshot, index) => {
    if (!snapshot.exists) return;
    const { tokens = {} } = (snapshot.data() || {}) as { tokens?: Record<string, true> };
    Object.keys(tokens).forEach((token) => {
      tokensToUsers[token] = userIds[index]!;
    });
  });
  const tokens = Object.keys(tokensToUsers);

  if (!tokens.length) {
    logger.log(`None of the ${userIds.length} users has a device token.`);
    return [];
  }

  const tokensToRemove: Record<string, string> = {};
  const failures = await sendToTokens(tokens, data);
  failures.forEach(({ token, error }) => {
    logger.error(`Failure sending notification to token ${logId(token)}`, error);
    if (isInvalidTokenError(error.code)) {
      tokensToRemove[token] = tokensToUsers[token]!;
    }
  });

  return removeUserTokens(tokensToRemove);
};

export const scheduleNotifications = onSchedule('every 5 minutes', async () => {
  // Session reminders go to the sessions that users saved to My Schedule.
  if (
    isFeatureOff('scheduleNotifications', 'notifications') ||
    isFeatureOff('scheduleNotifications', 'mySchedule')
  ) {
    return;
  }

  const { timeZone, attendance, stream, trackStreams = {} } = getSiteConfig();
  const todayDay = getTodayDateString(timeZone);
  const [notificationsConfigSnapshot, todaySessions] = await Promise.all([
    fetchConfig<{ icon?: string }>('notifications'),
    fetchSessionsOn(todayDay),
  ]);
  const icon = notificationsConfigSnapshot.data()?.icon || '';

  if (todaySessions.empty) {
    logger.log(todayDay, 'has no sessions');
    return;
  }

  const upcomingSessions = filterUpcoming(
    todaySessions.docs.flatMap((doc) => {
      const data = doc.data() as {
        title?: string;
        startTime?: string;
        track?: string;
        stream?: string;
      };
      // As the site picks it: the session's link, its track's, then the event's when it's online.
      const link =
        data.stream ??
        (data.track ? trackStreams[data.track] : undefined) ??
        (attendance && attendance !== 'inPerson' ? stream : undefined);
      return data.startTime
        ? [
            {
              id: doc.id,
              title: data.title,
              startTime: data.startTime,
              stream: link?.startsWith('https://') ? link : undefined,
            },
          ]
        : [];
    }),
    createTimeWindow(3, 3),
    10, // notification offset in minutes
    timeZone,
  );
  if (!upcomingSessions.length) return;
  logger.log(
    'Upcoming sessions',
    upcomingSessions.map(({ id }) => id),
  );

  const usersIdsSnapshot = await fetchFeaturedSessions();
  const usersIds = usersIdsSnapshot.docs.reduce(
    (acc: Record<string, Record<string, unknown>>, doc) => ({ ...acc, [doc.id]: doc.data() }),
    {},
  );

  for (const session of upcomingSessions) {
    const userIdsFeaturedSession = Object.keys(usersIds).filter((userId) =>
      Object.keys(usersIds[userId] || {}).includes(session.id),
    );
    if (!userIdsFeaturedSession.length) continue;

    const data: MulticastMessage['data'] = {
      title: session.title || '',
      body: `Starts ${parseTimeAndGetFromNow(session.startTime, timeZone)}`,
      icon,
      path: `/sessions/${session.id}`,
      ...(session.stream && { stream: session.stream }),
    };

    // The selection window is wider than the 5 minute schedule interval, so consecutive runs
    // can pick the same session. Claim it first so it is only sent once.
    const notificationId = `${todayDay}-${session.id}`;
    if (await claimSentNotification(notificationId)) {
      try {
        await sendPushNotificationToUsers(userIdsFeaturedSession, data);
      } catch (error) {
        await releaseSentNotification(notificationId);
        throw error;
      }
    } else {
      logger.log('Notification was already sent for session', session.id);
    }
  }
});
