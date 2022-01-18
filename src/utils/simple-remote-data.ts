interface SimpleInitialized {
  kind: 'initialized';
}

interface SimplePending {
  kind: 'pending';
}

interface SimpleFailure {
  kind: 'failure';
  error: Error;
}

interface SimpleSuccess<Data> {
  kind: 'success';
  data: Data;
}

// TODO: Move to separate file
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
