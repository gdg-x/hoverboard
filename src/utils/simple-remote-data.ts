export interface SimpleInitialized {
  kind: 'initialized';
}

export interface SimplePending {
  kind: 'pending';
}

export interface SimpleFailure {
  kind: 'failure';
  error: Error;
}

export interface SimpleSuccess<Data> {
  kind: 'success';
  data: Data;
}

export type SimpleRemoteData<Data> =
  | SimpleInitialized
  | SimplePending
  | SimpleFailure
  | SimpleSuccess<Data>;

export const isSimpleSuccess = <Data>(
  state: SimpleRemoteData<Data>
): state is SimpleSuccess<Data> => {
  return state.kind === 'success';
};
