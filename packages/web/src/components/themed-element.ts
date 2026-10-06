import { css, type CSSResultGroup, type CSSResultOrNative, LitElement } from 'lit';
import { theme } from '../styles/theme';

const host = css`
  :host {
    display: block;
  }
`;

export class ThemedElement extends LitElement {
  // Every subclass gets the shared theme first, so they only declare their own styles.
  protected static override finalizeStyles(styles?: CSSResultGroup): CSSResultOrNative[] {
    return [theme, host, ...super.finalizeStyles(styles)];
  }
}
