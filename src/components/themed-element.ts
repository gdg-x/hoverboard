import { css, LitElement } from 'lit-element';
import { flex, flexAlignment, positioning } from '../styles/layout';
import { theme } from '../styles/theme';

export class ThemedElement extends LitElement {
  static get styles() {
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
