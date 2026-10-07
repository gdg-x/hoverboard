import { css, type CSSResultGroup, type CSSResultOrNative, LitElement } from 'lit';
import { theme } from '../styles/theme';

const host = css`
  :host {
    display: block;
  }
`;

export class ThemedElement extends LitElement {
  // Every subclass gets the shared styles first, so it only declares its own styles. The color
  // tokens come from the `:root` style that the build writes into index.html.
  protected static override finalizeStyles(styles?: CSSResultGroup): CSSResultOrNative[] {
    return [theme, host, ...super.finalizeStyles(styles)];
  }
}
