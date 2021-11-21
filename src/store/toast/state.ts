import { Initialized, RemoteData } from '@abraham/remotedata';
import { Toast } from '../../models/toast';

export type ToastState = RemoteData<Error, Toast>;
export const initialToastState: ToastState = new Initialized();
