import { Initialized, Success } from '@abraham/remotedata';
import type { User } from 'firebase/auth';
import { fireEvent } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { deepQuerySelector, screen, within } from 'shadow-dom-testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { signOut } from '../../store/auth';
import { openProfileDialog, openSigninDialog } from '../../store/dialogs';
import type { AccountMenu } from './account-menu';
import './account-menu';

vi.mock('../../store/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/auth')>()),
  signOut: vi.fn(),
}));

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openProfileDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));

const ada = new Success({
  uid: 'ada',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  photoURL: null,
} as unknown as User);

const render = async (user: AccountMenu['user'] = new Initialized()) => {
  const { element, shadowRoot } = await fixture<AccountMenu>(html`<account-menu></account-menu>`);
  element['user'] = user;
  await element.updateComplete;
  return { element, shadowRoot, menu: () => within(deepQuerySelector(shadowRoot, 'hb-menu')!) };
};

describe('account-menu', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('asks a signed-out visitor to sign in', async () => {
    await render();

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Sign in' }));

    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('names the menu after the signed-in visitor', async () => {
    const { menu } = await render(ada);

    expect(
      await menu().findByShadowRole('button', { name: 'Account of Ada Lovelace' }),
    ).toBeInTheDocument();
  });

  it('links to My Schedule and signs out', async () => {
    const { menu } = await render(ada);

    expect(
      menu().getByShadowRole('menuitem', { name: 'My Schedule', hidden: true }),
    ).toHaveAttribute('href', '/schedule/my-schedule');

    fireEvent.click(menu().getByShadowRole('menuitem', { name: 'Sign out', hidden: true }));

    expect(signOut).toHaveBeenCalled();
  });

  it('leaves out My Schedule when the feature is off', async () => {
    setFeatures({ mySchedule: false, reactions: false });
    const { menu } = await render(ada);

    expect(menu().getAllByShadowRole('menuitem', { hidden: true })).toHaveLength(1);
    expect(
      menu().queryByShadowRole('menuitem', { name: 'My Schedule', hidden: true }),
    ).not.toBeInTheDocument();
  });

  it('opens the public profile, with reactions on', async () => {
    const { menu } = await render(ada);

    fireEvent.click(menu().getByShadowRole('menuitem', { name: 'Public profile', hidden: true }));

    expect(openProfileDialog).toHaveBeenCalled();
  });

  it('has no public profile with reactions off', async () => {
    setFeatures({ reactions: false });
    const { menu } = await render(ada);

    expect(
      menu().queryByShadowRole('menuitem', { name: 'Public profile', hidden: true }),
    ).not.toBeInTheDocument();
  });
});
