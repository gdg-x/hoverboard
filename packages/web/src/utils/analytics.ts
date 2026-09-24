import { logEvent } from 'firebase/analytics';
import { analytics } from '../firebase';

export const logPageView = () => logEvent(analytics, 'page_view');
export const logLogin = () => logEvent(analytics, 'login');
