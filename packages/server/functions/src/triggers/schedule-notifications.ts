// https://github.com/import-js/eslint-plugin-import/issues/1810

import type { MulticastMessage } from 'firebase-admin/messaging';
import * as logger from 'firebase-functions/logger';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { fetchConfig } from '../db/config.js';
import { fetchFeaturedSessions } from '../db/featured-sessions.js';
import { fetchNotificationsUser, removeUserTokens } from '../db/notifications-users.js';
import { getSchedule } from '../db/schedule.js';
import { claimSentNotification, releaseSentNotification } from '../db/sent-notifications.js';
import { fetchSession } from '../db/sessions.js';
import {
  createTimeWindow,
  filterUpcomingTimeslots,
  getTodayDateString,
  parseTimeAndGetFromNow,
} from '../time.js';
import { isInvalidTokenError, sendToTokens } from '../utils/messaging.js';

const sendPushNotificationToUsers = async (userIds: string[], data: MulticastMessage['data']) => {
  logger.log('sendPushNotificationToUsers user ids', userIds, 'with notification', data);

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
    logger.log('There are no device tokens to send to for user ids', userIds);
    return [];
  }

  const tokensToRemove: Record<string, string> = {};
  const failures = await sendToTokens(tokens, data);
  failures.forEach(({ token, error }) => {
    logger.error('Failure sending notification to', token, error);
    if (isInvalidTokenError(error.code)) {
      tokensToRemove[token] = tokensToUsers[token]!;
    }
  });

  return removeUserTokens(tokensToRemove);
};

export const scheduleNotifications = onSchedule('every 5 minutes', async () => {
  const notificationsConfigPromise = fetchConfig<{ timezone?: string; icon?: string }>(
    'notifications',
  );
  const schedulePromise = getSchedule();

  const [notificationsConfigSnapshot, scheduleSnapshot] = await Promise.all([
    notificationsConfigPromise,
    schedulePromise,
  ]);
  if (!notificationsConfigSnapshot.exists) {
    logger.warn(
      'Session notifications are not configured. Set the `config/notifications` Firestore document.',
    );
    return;
  }
  const notificationsConfig = notificationsConfigSnapshot.data() as {
    timezone?: string;
    icon?: string;
  };

  const schedule = scheduleSnapshot.docs.reduce(
    (acc: Record<string, any>, doc) => ({ ...acc, [doc.id]: doc.data() }),
    {},
  );
  const todayDay = getTodayDateString(notificationsConfig.timezone);

  if (schedule[todayDay]) {
    const timeWindow = createTimeWindow(3, 3);
    const timezone = notificationsConfig.timezone || '';

    const upcomingTimeslots = filterUpcomingTimeslots(
      schedule[todayDay].timeslots || [],
      timeWindow,
      10, // notification offset in minutes
      timezone,
    );

    const upcomingSessions: string[] = upcomingTimeslots.reduce(
      (result: string[], timeslot: { sessions?: { items?: string[] }[] }) =>
        (timeslot.sessions || []).reduce(
          (aggregatedSessions: string[], current: { items?: string[] }) => [
            ...aggregatedSessions,
            ...(current.items || []),
          ],
          result,
        ),
      [],
    );
    const usersIdsSnapshot = await fetchFeaturedSessions();
    const usersIds = usersIdsSnapshot.docs.reduce(
      (acc: Record<string, Record<string, unknown>>, doc) => ({ ...acc, [doc.id]: doc.data() }),
      {},
    );

    for (const upcomingSession of upcomingSessions) {
      const sessionInfoSnapshot = await fetchSession(upcomingSession);
      if (!sessionInfoSnapshot.exists) continue;

      const userIdsFeaturedSession = Object.keys(usersIds).filter(
        (userId) =>
          !!Object.keys(usersIds[userId] || {}).filter(
            (sessionId) => sessionId.toString() === upcomingSession.toString(),
          ).length,
      );

      const session = sessionInfoSnapshot.data();
      const firstTimeslot = upcomingTimeslots[0];
      const fromNow = firstTimeslot
        ? parseTimeAndGetFromNow(firstTimeslot.startTime, timezone)
        : '';

      if (userIdsFeaturedSession.length) {
        const data: MulticastMessage['data'] = {
          title: session?.title || '',
          body: `Starts ${fromNow}`,
          icon: notificationsConfig.icon || '',
          path: `/sessions/${upcomingSession}`,
        };

        // The selection window is wider than the 5 minute schedule interval, so consecutive runs
        // can pick the same session. Claim it first so it is only sent once.
        const notificationId = `${todayDay}-${upcomingSession}`;
        if (await claimSentNotification(notificationId)) {
          try {
            await sendPushNotificationToUsers(userIdsFeaturedSession, data);
          } catch (error) {
            await releaseSentNotification(notificationId);
            throw error;
          }
        } else {
          logger.log('Notification was already sent for session', upcomingSession);
        }
      }

      if (upcomingSessions.length) {
        logger.log('Upcoming sessions', upcomingSessions);
      } else {
        logger.log('There is no sessions right now');
      }
    }
  } else {
    logger.log(todayDay, 'was not found in the schedule');
  }
});
