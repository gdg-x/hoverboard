import { fireEvent, within } from '@testing-library/dom';
import { html } from 'lit';
import { describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './hb-dialog';
import type { HbDialog } from './hb-dialog';

const getDialog = (container: HTMLElement) =>
  within(container).getByRole<HTMLDialogElement>('dialog', { hidden: true });

describe('hb-dialog', () => {
  it('is closed at first, and named by its heading', async () => {
    const { element, shadowRootForWithin } = await fixture<HbDialog>(
      html`<hb-dialog heading="Subscribe"><p>Text</p></hb-dialog>`,
    );
    const dialog = getDialog(shadowRootForWithin);

    expect(dialog.open).toBe(false);

    element.open = true;
    await element.updateComplete;

    expect(dialog).toHaveAccessibleName('Subscribe');
  });

  it('opens as a modal and closes', async () => {
    const { element, shadowRootForWithin } = await fixture<HbDialog>(
      html`<hb-dialog heading="Subscribe"></hb-dialog>`,
    );
    const dialog = getDialog(shadowRootForWithin);

    element.open = true;
    await element.updateComplete;

    expect(dialog.open).toBe(true);

    element.open = false;
    await element.updateComplete;

    expect(dialog.open).toBe(false);
  });

  it('closes with its close button and fires close', async () => {
    const onClose = vi.fn();
    const { element, shadowRoot } = await fixture<HbDialog>(
      html`<hb-dialog heading="Subscribe" open @close="${() => onClose()}"></hb-dialog>`,
    );
    const close = shadowRoot.querySelector('hb-icon-button')!;

    fireEvent.click(close);
    await element.updateComplete;

    expect(element.open).toBe(false);
    expect(close).toHaveAttribute('label', 'Close');
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes on a click on the backdrop, but not in the panel', async () => {
    const { element, shadowRootForWithin } = await fixture<HbDialog>(
      html`<hb-dialog heading="Subscribe" open></hb-dialog>`,
    );

    fireEvent.click(within(shadowRootForWithin).getByRole('heading'));
    await element.updateComplete;

    expect(element.open).toBe(true);

    fireEvent.click(getDialog(shadowRootForWithin));
    await element.updateComplete;

    expect(element.open).toBe(false);
  });

  it('follows the dialog when the browser closes it, as with Escape', async () => {
    const { element, shadowRootForWithin } = await fixture<HbDialog>(
      html`<hb-dialog heading="Subscribe" open></hb-dialog>`,
    );

    getDialog(shadowRootForWithin).close();

    expect(element.open).toBe(false);
  });
});
