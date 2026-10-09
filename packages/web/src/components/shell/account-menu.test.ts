import { Initialized, Success } from '@abraham/remotedata';
import type { User } from 'firebase/auth';
import { fireEvent, within } from '@testing-library/dom';
import { html, render as litRender, nothing } from 'lit';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { signOut } from '../../store/auth';
import { openSigninDialog } from '../../store/dialogs';
import type { AccountMenu } from './account-menu';
import './account-menu';

vi.mock('../../store/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/auth')>()),
  signOut: vi.fn(),
}));

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
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
  return { element, shadowRoot };
};

describe('account-menu', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('asks a signed-out visitor to sign in', async () => {
    const { shadowRoot } = await render();
    const button = shadowRoot.querySelector('hb-icon-button')!;

    expect(button).toHaveAttribute('label', 'Sign in');

    fireEvent.click(button);

    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('names the menu after the signed-in visitor', async () => {
    const { shadowRoot } = await render(ada);

    expect(shadowRoot.querySelector('hb-menu hb-icon-button')).toHaveAttribute(
      'label',
      'Account of Ada Lovelace',
    );
  });

  it('links to My Schedule and signs out', async () => {
    const { shadowRoot } = await render(ada);
    const menu = within(shadowRoot.querySelector<HTMLElement>('hb-menu')!);

    expect(menu.getByRole('menuitem', { name: 'My Schedule', hidden: true })).toHaveAttribute(
      'href',
      '/schedule/my-schedule',
    );

    fireEvent.click(menu.getByRole('menuitem', { name: 'Sign out', hidden: true }));

    expect(signOut).toHaveBeenCalled();
  });

  it('leaves out My Schedule when the feature is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render(ada);
    const menu = within(shadowRoot.querySelector<HTMLElement>('hb-menu')!);

    expect(menu.getAllByRole('menuitem', { hidden: true })).toHaveLength(1);
    expect(menu.queryByRole('menuitem', { name: 'My Schedule', hidden: true })).toBeNull();
  });
});
