import { describe, expect, it, vi } from 'vitest';
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture } from '../../__tests__/helpers/fixtures';
import { ClickOutsideController } from './click-outside-controller';

@customElement('click-outside-test-host')
class ClickOutsideTestHost extends LitElement {
  onClickOutside = vi.fn();
  controller = new ClickOutsideController(this, () => this.onClickOutside());

  override render() {
    return html`<div></div>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'click-outside-test-host': ClickOutsideTestHost;
  }
}

describe('ClickOutsideController', () => {
  it('does not invoke the callback before start() is called', async () => {
    const { element } = await fixture<ClickOutsideTestHost>(
      html`<click-outside-test-host></click-outside-test-host>`,
    );

    document.body.click();

    expect(element.onClickOutside).not.toHaveBeenCalled();
  });

  it('invokes the callback when clicking outside the host after start()', async () => {
    const { element } = await fixture<ClickOutsideTestHost>(
      html`<click-outside-test-host></click-outside-test-host>`,
    );
    element.controller.start();

    document.body.click();

    expect(element.onClickOutside).toHaveBeenCalledTimes(1);
  });

  it('does not invoke the callback when clicking inside the host', async () => {
    const { element, shadowRoot } = await fixture<ClickOutsideTestHost>(
      html`<click-outside-test-host></click-outside-test-host>`,
    );
    element.controller.start();

    shadowRoot.querySelector('div')!.click();

    expect(element.onClickOutside).not.toHaveBeenCalled();
  });

  it('stops invoking the callback after stop() is called', async () => {
    const { element } = await fixture<ClickOutsideTestHost>(
      html`<click-outside-test-host></click-outside-test-host>`,
    );
    element.controller.start();
    element.controller.stop();

    document.body.click();

    expect(element.onClickOutside).not.toHaveBeenCalled();
  });

  it('stops listening when the host disconnects', async () => {
    const { element } = await fixture<ClickOutsideTestHost>(
      html`<click-outside-test-host></click-outside-test-host>`,
    );
    element.controller.start();
    element.remove();

    document.body.click();

    expect(element.onClickOutside).not.toHaveBeenCalled();
  });
});
