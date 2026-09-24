import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { User } from '../models/user';
import { store } from '../store';
import { openSigninDialog } from '../store/dialogs';
import { setUserSuccess } from '../store/user';
import './auth-required';
import { AuthRequired } from './auth-required';

vi.mock('../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/dialogs')>()),
  openSigninDialog: vi.fn(),
}));

const mockOpenDialog = vi.mocked(openSigninDialog);

describe('auth-required', () => {
  let element!: AuthRequired;
  let shadowRoot!: ShadowRoot;

  beforeAll(async () => {
    const render = await fixture<AuthRequired>(html`
      <auth-required>
        <p slot="prompt">Please sign in</p>
        <div>Welcome</div>
      </auth-required>
    `);

    element = render.element;
    shadowRoot = render.shadowRoot;
  });

  beforeEach(() => {
    mockOpenDialog.mockClear();
  });

  it('should be registered', () => {
    expect(customElements.get('auth-required')).toBeDefined();
  });

  it('shows unauthenticated prompt', () => {
    expect(shadowRoot.querySelector<HTMLDivElement>('md-text-button')).not.toHaveAttribute(
      'hidden',
    );

    const slots = shadowRoot.querySelectorAll('slot');

    expect(slots).toHaveLength(2);
    expect(slots[0]).not.toHaveAttribute('hidden');
    expect(slots[0]).toHaveAttribute('name', 'prompt');
    expect(slots[0]!.assignedElements()[0]).toHaveTextContent('Please sign in');
    expect(slots[1]).toHaveAttribute('hidden');
    expect(slots[1]).not.toHaveAttribute('name');
    expect(slots[1]!.assignedElements()[0]).toHaveTextContent('Welcome');
  });

  it('opens dialog on tap', () => {
    fireEvent.click(shadowRoot.querySelector('md-text-button')!);

    expect(mockOpenDialog).toHaveBeenCalledTimes(1);
  });

  it('shows authenticated content', async () => {
    store.dispatch(setUserSuccess({ uid: '1' } as User));
    await element.updateComplete;

    expect(shadowRoot.querySelector<HTMLDivElement>('md-text-button')).toHaveAttribute('hidden');

    const slots = shadowRoot.querySelectorAll('slot');

    expect(slots).toHaveLength(2);
    expect(slots[0]).toHaveAttribute('hidden');
    expect(slots[1]).not.toHaveAttribute('hidden');
  });
});
