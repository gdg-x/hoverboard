import { css, LitElement } from 'lit';
import { theme } from '../styles/theme';

export class ThemedElement extends LitElement {
  static override get styles() {
    return [
      theme,
      css`
        :host {
          display: block;
        }
      `,
    ];
  }
}
