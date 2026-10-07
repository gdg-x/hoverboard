import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

export const logPageView = () => analytics && logEvent(analytics, 'page_view');
export const logLogin = () => analytics && logEvent(analytics, 'login');
