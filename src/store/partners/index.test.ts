import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { collection, collectionGroup, onSnapshot, orderBy } from 'firebase/firestore';
import reducer, { initialState, selectPartnerGroups, subscribe, unsubscribe } from '.';
import type { Partner } from '../../models/partner';
import type { PartnerGroupWithoutItems } from '../../models/partner-group';
import type { RootState } from '..';
import { store } from '..';
import type { PartnersState } from '.';

vi.mock('firebase/firestore');
vi.mock('..', () => ({
  store: {
    dispatch: vi.fn(),
  },
}));

describe('partners', () => {
  it('starts with initialized groups, partners, and subscriptions', () => {
    expect(reducer(undefined, { type: '@@INIT' })).toStrictEqual(initialState);
  });

  it('subscribes only once while already subscribed', () => {
    vi.mocked(onSnapshot).mockImplementation(() => vi.fn());

    const state = reducer(reducer(undefined, subscribe()), subscribe());

    expect(onSnapshot).toHaveBeenCalledTimes(2);
    expect(state.partnersSubscription).toBeInstanceOf(Success);
    expect(state.groupsSubscription).toBeInstanceOf(Success);
  });

  it('unsubscribes from both listeners and resets the slice', () => {
    const unsubscribePartners = vi.fn();
    const unsubscribeGroups = vi.fn();

    vi.mocked(onSnapshot)
      .mockImplementationOnce(() => unsubscribePartners)
      .mockImplementationOnce(() => unsubscribeGroups);

    const subscribedState = reducer(undefined, subscribe());
    const state = reducer(subscribedState, unsubscribe());

    expect(unsubscribePartners).toHaveBeenCalled();
    expect(unsubscribeGroups).toHaveBeenCalled();
    expect(state).toStrictEqual(initialState);
  });
});

describe('selectPartnerGroups', () => {
  const createPartnersState = (): PartnersState => ({
    groups: new Initialized(),
    partners: new Initialized(),
    partnersSubscription: new Initialized(),
    groupsSubscription: new Initialized(),
  });
  let partnersState = createPartnersState();

  const getState = (): RootState =>
    ({
      partners: partnersState,
    }) as unknown as RootState;

  beforeEach(() => {
    vi.clearAllMocks();
    partnersState = createPartnersState();
    vi.mocked(store.dispatch).mockImplementation((action) => {
      partnersState = reducer(partnersState, action);

      return action;
    });
  });

  it('subscribes on first read, then merges partner items into their groups', () => {
    let partnersNext: ((snapshot: { docs: unknown[] }) => void) | undefined;
    let groupsNext: ((snapshot: { docs: unknown[] }) => void) | undefined;
    let subscriptionCallCount = 0;

    vi.mocked(onSnapshot).mockImplementation((_query, nextOrObserver) => {
      subscriptionCallCount += 1;

      if (subscriptionCallCount === 1) {
        partnersNext = nextOrObserver as (snapshot: { docs: unknown[] }) => void;
      } else {
        groupsNext = nextOrObserver as (snapshot: { docs: unknown[] }) => void;
      }

      return vi.fn();
    });

    expect(selectPartnerGroups(getState())).toStrictEqual(new Pending());
    expect(collectionGroup).toHaveBeenCalledWith(undefined, 'items');
    expect(collection).toHaveBeenCalledWith(undefined, 'partners');
    expect(orderBy).toHaveBeenCalledWith('order');

    const groups: PartnerGroupWithoutItems[] = [
      { id: 'group-1', order: 1, title: 'Gold Partners' },
      { id: 'group-2', order: 2, title: 'Community Partners' },
    ];
    const partners: Partner[] = [
      {
        id: 'partner-1',
        parentId: 'group-1',
        logoUrl: 'https://example.com/logo-1.svg',
        name: 'Partner One',
        order: 1,
        url: 'https://example.com/partner-1',
      },
      {
        id: 'partner-2',
        parentId: 'group-2',
        logoUrl: 'https://example.com/logo-2.svg',
        name: 'Partner Two',
        order: 2,
        url: 'https://example.com/partner-2',
      },
    ];

    groupsNext?.({
      docs: groups.map((group) => ({
        id: group.id,
        data: () => ({ order: group.order, title: group.title }),
      })),
    });
    partnersNext?.({
      docs: partners.map((partner) => ({
        id: partner.id,
        data: () => ({
          logoUrl: partner.logoUrl,
          name: partner.name,
          order: partner.order,
          url: partner.url,
        }),
        ref: { parent: { parent: { id: partner.parentId } } },
      })),
    });

    expect(selectPartnerGroups(getState())).toStrictEqual(
      new Success([
        { ...groups[0], items: [partners[0]] },
        { ...groups[1], items: [partners[1]] },
      ]),
    );
  });

  it('returns the groups failure when the groups subscription errors', () => {
    let groupsError: ((error: Error) => void) | undefined;
    let subscriptionCallCount = 0;

    vi.mocked(onSnapshot).mockImplementation((_query, _nextOrObserver, errorCallback) => {
      subscriptionCallCount += 1;

      if (subscriptionCallCount === 2) {
        groupsError = errorCallback as unknown as (error: Error) => void;
      }

      return vi.fn();
    });

    selectPartnerGroups(getState());

    const error = new Error('groups failed');
    groupsError?.(error);

    expect(selectPartnerGroups(getState())).toStrictEqual(new Failure(error));
  });

  it('returns the partners failure when the partners subscription errors', () => {
    let partnersError: ((error: Error) => void) | undefined;
    let subscriptionCallCount = 0;

    vi.mocked(onSnapshot).mockImplementation((_query, _nextOrObserver, errorCallback) => {
      subscriptionCallCount += 1;

      if (subscriptionCallCount === 1) {
        partnersError = errorCallback as unknown as (error: Error) => void;
      }

      return vi.fn();
    });

    selectPartnerGroups(getState());

    const error = new Error('partners failed');
    partnersError?.(error);

    expect(selectPartnerGroups(getState())).toStrictEqual(new Failure(error));
  });

  it('returns pending while one side is still loading', () => {
    const state = {
      partners: {
        ...initialState,
        groups: new Success([{ id: 'group-1', order: 1, title: 'Gold Partners' }]),
        partners: new Pending(),
      },
    } as unknown as RootState;

    expect(selectPartnerGroups(state)).toStrictEqual(new Pending());
  });

  it('returns an existing failure state without re-subscribing', () => {
    const error = new Error('boom');
    const state = {
      partners: {
        ...initialState,
        groups: new Failure(error),
        partners: new Success([]),
      },
    } as unknown as RootState;

    expect(selectPartnerGroups(state)).toStrictEqual(new Failure(error));
    expect(store.dispatch).not.toHaveBeenCalled();
  });
});
