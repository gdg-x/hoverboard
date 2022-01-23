import { getAnalytics, logEvent } from 'firebase/analytics';
import { firebaseApp } from './firebase';

const analytics = getAnalytics(firebaseApp);

export const logPageView = () => logEvent(analytics, 'page_view');
export const logLogin = () => logEvent(analytics, 'login');
