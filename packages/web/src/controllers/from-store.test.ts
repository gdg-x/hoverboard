import { afterEach, describe, expect, it } from 'vitest';
import { html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fixture } from '../../__tests__/helpers/fixtures';
import { store } from '../store';
import { queueSnackbar, removeSnackbar } from '../store/snackbars';
import { fromStore } from './from-store';

@customElement('from-store-test-subject')
class FromStoreTestSubject extends LitElement {
  @fromStore((state) => state.snackbars.length)
  count!: number;

  @fromStore((state, host: FromStoreTestSubject) => state.snackbars.length + host.offset)
  total!: number;

  offset = 100;
  changes: string[] = [];

  protected override willUpdate(changed: Map<PropertyKey, unknown>) {
    if (changed.has('count')) this.changes.push('count');
  }

  override render() {
    return html`<span>${this.count}/${this.total}</span>`;
  }
}

afterEach(() => {
  store.getState().snackbars.forEach(({ id }) => store.dispatch(removeSnackbar(id)));
});

describe('fromStore', () => {
  it('exposes the selected value and re-renders when it changes', async () => {
    const { element, shadowRoot } = await fixture<FromStoreTestSubject>(
      html`<from-store-test-subject></from-store-test-subject>`,
    );
    expect(shadowRoot.textContent).toContain('0/100');

    store.dispatch(queueSnackbar('hello'));
    await element.updateComplete;

    expect(element.count).toBe(1);
    expect(shadowRoot.textContent).toContain('1/101');
    expect(element.changes).toContain('count');
  });

  it('allows overriding the value until the store changes it', async () => {
    const { element, shadowRoot } = await fixture<FromStoreTestSubject>(
      html`<from-store-test-subject></from-store-test-subject>`,
    );

    element.count = 42;
    await element.updateComplete;

    expect(shadowRoot.textContent).toContain('42/');
  });
});
