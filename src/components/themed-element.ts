import { css, LitElement } from 'lit';
import { flex, flexAlignment, positioning } from '../styles/layout';
import { theme } from '../styles/theme';

export class ThemedElement extends LitElement {
  static override get styles() {
    return [
      theme,
      flex,
      flexAlignment,
      positioning,
      css`
        :host {
          display: block;
        }
      `,
    ];
  }
}
