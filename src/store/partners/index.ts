import { Failure, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { createSelector, createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  collection,
  collectionGroup,
  onSnapshot,
  orderBy,
  query,
  Unsubscribe,
} from 'firebase/firestore';
import { RootState, store } from '..';
import { db } from '../../firebase';
import { Partner } from '../../models/partner';
import { PartnerGroup, PartnerGroupWithoutItems } from '../../models/partner-group';
import { dataWithParentId, mergeDataAndId } from '../../utils/firestore';

export type PartnerGroupsState = RemoteData<Error, PartnerGroup[]>;

export interface PartnersState {
  groups: RemoteData<Error, PartnerGroupWithoutItems[]>;
  partners: RemoteData<Error, Partner[]>;
  partnersSubscription: RemoteData<Error, Unsubscribe>;
  groupsSubscription: RemoteData<Error, Unsubscribe>;
}

export const initialState = {
  groups: new Initialized(),
  partners: new Initialized(),
  partnersSubscription: new Initialized(),
  groupsSubscription: new Initialized(),
} as PartnersState;

const subscribeToPartners = () => {
  return onSnapshot(
    query(collectionGroup(db, 'items'), orderBy('order')),
    (snapshot) => {
      store.dispatch(setPartnersSuccess(snapshot.docs.map<Partner>(dataWithParentId)));
    },
    (error) => store.dispatch(setPartnersFailure(error as Error))
  );
};

const subscribeToGroups = () => {
  return onSnapshot(
    query(collection(db, 'partners'), orderBy('order')),
    (snapshot) => {
      store.dispatch(setGroupsSuccess(snapshot.docs.map<PartnerGroupWithoutItems>(mergeDataAndId)));
    },
    (error) => store.dispatch(setGroupsFailure(error as Error))
  );
};

const partnersSlice = createSlice({
  name: 'partners',
  initialState,
  reducers: {
    subscribe(state) {
      if (state.partnersSubscription instanceof Initialized) {
        state.partnersSubscription = new Success(subscribeToPartners());
        state.partners = new Pending();
      }
      if (state.groupsSubscription instanceof Initialized) {
        state.groupsSubscription = new Success(subscribeToGroups());
        state.groups = new Pending();
      }
    },
    unsubscribe(state) {
      if (state.partnersSubscription instanceof Success) {
        state.partnersSubscription.data();
      }
      if (state.groupsSubscription instanceof Success) {
        state.groupsSubscription.data();
      }
      state.partnersSubscription = new Initialized();
      state.partners = new Initialized();
      state.groupsSubscription = new Initialized();
      state.groups = new Initialized();
    },
    setPartnersSuccess(state, action: PayloadAction<Partner[]>) {
      state.partners = new Success(action.payload);
    },
    setPartnersFailure(state, action: PayloadAction<Error>) {
      state.partners = new Failure(action.payload);
    },
    setGroupsSuccess(state, action: PayloadAction<PartnerGroupWithoutItems[]>) {
      state.groups = new Success(action.payload);
    },
    setGroupsFailure(state, action: PayloadAction<Error>) {
      state.groups = new Failure(action.payload);
    },
  },
});

const selectPartners = (state: RootState) => state.partners.partners;
const selectGroups = (state: RootState) => state.partners.groups;

export const selectPartnerGroups = createSelector(
  selectGroups,
  selectPartners,
  (groups: PartnersState['groups'], partners: PartnersState['partners']): PartnerGroupsState => {
    if (groups instanceof Initialized || partners instanceof Initialized) {
      store.dispatch(subscribe());
      return new Pending();
    }

    if (groups instanceof Success && partners instanceof Success) {
      const partnerGroups = groups.data.map((group) => {
        return {
          ...group,
          items: partners.data.filter((partner: Partner) => partner.parentId === group.id),
        };
      });
      return new Success(partnerGroups);
    }

    if (groups instanceof Failure) {
      return groups;
    }

    if (partners instanceof Failure) {
      return partners;
    }

    return new Pending();
  }
);

const {
  subscribe,
  unsubscribe,
  setPartnersSuccess,
  setPartnersFailure,
  setGroupsSuccess,
  setGroupsFailure,
} = partnersSlice.actions;

export { subscribe, unsubscribe };
export default partnersSlice.reducer;
