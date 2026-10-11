import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { deepQuerySelector, deepQuerySelectorAll, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { User } from '../../models/user';
import { store } from '../../store';
import { openSigninDialog } from '../../store/dialogs';
import { setUserSuccess } from '../../store/user';
import './auth-required';
import { AuthRequired } from './auth-required';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openSigninDialog: vi.fn(),
}));

const mockOpenDialog = vi.mocked(openSigninDialog);

// The slots of auth-required itself, not those of the hb-button inside it.
const ownSlots = (shadowRoot: ShadowRoot) =>
  deepQuerySelectorAll<HTMLSlotElement>(shadowRoot, 'slot').filter(
    (slot) => slot.getRootNode() === shadowRoot,
  );

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
    expect(deepQuerySelector(shadowRoot, 'hb-button')).not.toHaveAttribute('hidden');

    const slots = ownSlots(shadowRoot);

    expect(slots).toHaveLength(2);
    expect(slots[0]).not.toHaveAttribute('hidden');
    expect(slots[0]).toHaveAttribute('name', 'prompt');
    expect(slots[0]!.assignedElements()[0]).toHaveTextContent('Please sign in');
    expect(slots[1]).toHaveAttribute('hidden');
    expect(slots[1]).not.toHaveAttribute('name');
    expect(slots[1]!.assignedElements()[0]).toHaveTextContent('Welcome');
  });

  it('opens dialog on tap', () => {
    fireEvent.click(screen.getByShadowRole('button', { name: 'Sign in' }));

    expect(mockOpenDialog).toHaveBeenCalledTimes(1);
  });

  it('shows authenticated content', async () => {
    store.dispatch(setUserSuccess({ uid: '1' } as User));
    await element.updateComplete;

    expect(deepQuerySelector(shadowRoot, 'hb-button')).toHaveAttribute('hidden');

    const slots = ownSlots(shadowRoot);

    expect(slots).toHaveLength(2);
    expect(slots[0]).toHaveAttribute('hidden');
    expect(slots[1]).not.toHaveAttribute('hidden');
  });
});
