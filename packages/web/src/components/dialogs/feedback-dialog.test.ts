import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { Session } from '../../models/session';
import { closeDialog } from '../../store/dialogs';
import type { FeedbackDialog } from './feedback-dialog';
import './feedback-dialog';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  closeDialog: vi.fn(),
}));

const mockCloseDialog = vi.mocked(closeDialog);

const session: Session = {
  id: 'session-1',
  title: 'A session',
  description: 'A description',
};

describe('feedback-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('feedback-dialog')).toBeDefined();
  });

  it('renders the feedback heading and a closed dialog by default', async () => {
    const { shadowRoot } = await fixture<FeedbackDialog>(html`<feedback-dialog></feedback-dialog>`);

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('heading', 'Review session');
    expect(shadowRoot.querySelector('hb-dialog')).not.toHaveAttribute('open');
  });

  it('opens the dialog and passes the session id to feedback-block', async () => {
    const { element, shadowRoot } = await fixture<FeedbackDialog>(
      html`<feedback-dialog></feedback-dialog>`,
    );
    element['open'] = true;
    element['session'] = session;
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('open');
    expect(shadowRoot.querySelector('feedback-block')).toHaveProperty('sessionId', session.id);
  });

  it('dispatches closeDialog when the dialog is closed', async () => {
    const { shadowRoot } = await fixture<FeedbackDialog>(html`<feedback-dialog></feedback-dialog>`);

    shadowRoot.querySelector('hb-dialog')!.dispatchEvent(new Event('close'));

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
