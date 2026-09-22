import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import type { HoverboardDialog } from './hoverboard-dialog';
import './hoverboard-dialog';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('hoverboard-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('hoverboard-dialog')).toBeDefined();
  });

  it('renders headline, content, and actions slots', async () => {
    const { shadowRoot } = await fixture<HoverboardDialog>(html`
      <hoverboard-dialog>
        <div slot="headline">Headline</div>
        <div slot="content">Content</div>
        <button slot="actions">Action</button>
      </hoverboard-dialog>
    `);

    expect(shadowRoot.querySelector('slot[name="headline"]')).not.toBeNull();
    expect(shadowRoot.querySelector('slot[name="content"]')).not.toBeNull();
    expect(shadowRoot.querySelector('slot[name="actions"]')).not.toBeNull();
  });

  it('is closed by default', async () => {
    const { shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );

    expect(shadowRoot.querySelector('dialog')).not.toHaveAttribute('open');
  });

  it('calls showModal when opened', async () => {
    const { element, shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );
    const dialog = shadowRoot.querySelector('dialog')! as HTMLDialogElement & {
      showModal: () => void;
    };
    const showModal = jest.fn(() => dialog.setAttribute('open', ''));
    dialog.showModal = showModal;

    element.open = true;
    await element.updateComplete;

    expect(showModal).toHaveBeenCalled();
    expect(dialog).toHaveAttribute('open');
  });

  it('calls close and dispatches closed when close() is invoked', async () => {
    const { element, shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );
    element.open = true;
    await element.updateComplete;
    const closedHandler = jest.fn();
    element.addEventListener('closed', closedHandler);

    element.close();

    expect(shadowRoot.querySelector('dialog')).not.toHaveAttribute('open');
    expect(closedHandler).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it('closes and dispatches closed when dismissed natively (e.g. Escape)', async () => {
    const { element, shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );
    element.open = true;
    await element.updateComplete;
    const closedHandler = jest.fn();
    element.addEventListener('closed', closedHandler);

    shadowRoot.querySelector('dialog')!.dispatchEvent(new Event('close'));

    expect(closedHandler).toHaveBeenCalled();
    expect(element.open).toBe(false);
  });

  it('closes when a click lands outside the dialog content box (backdrop click)', async () => {
    const { element, shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );
    element.open = true;
    await element.updateComplete;
    const dialog = shadowRoot.querySelector('dialog')!;
    dialog.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 100,
      width: 200,
      height: 200,
      bottom: 300,
      right: 300,
      x: 100,
      y: 100,
      toJSON: () => '',
    }));
    const closedHandler = jest.fn();
    element.addEventListener('closed', closedHandler);

    dialog.dispatchEvent(new MouseEvent('click', { clientX: 10, clientY: 10 }));

    expect(closedHandler).toHaveBeenCalled();
  });

  it('does not close when a click lands inside the dialog content box', async () => {
    const { element, shadowRoot } = await fixture<HoverboardDialog>(
      html`<hoverboard-dialog></hoverboard-dialog>`,
    );
    element.open = true;
    await element.updateComplete;
    const dialog = shadowRoot.querySelector('dialog')!;
    dialog.getBoundingClientRect = jest.fn(() => ({
      top: 100,
      left: 100,
      width: 200,
      height: 200,
      bottom: 300,
      right: 300,
      x: 100,
      y: 100,
      toJSON: () => '',
    }));
    const closedHandler = jest.fn();
    element.addEventListener('closed', closedHandler);

    dialog.dispatchEvent(new MouseEvent('click', { clientX: 150, clientY: 150 }));

    expect(closedHandler).not.toHaveBeenCalled();
  });
});
