import { css, type CSSResultGroup, type CSSResultOrNative, LitElement } from 'lit';
import { theme } from '../styles/theme';
import { defaultTheme } from '../themes/default';

const host = css`
  :host {
    display: block;
  }
`;

export class ThemedElement extends LitElement {
  // Every subclass gets the theme tokens and shared styles first, so they only declare their own styles.
  protected static override finalizeStyles(styles?: CSSResultGroup): CSSResultOrNative[] {
    return [defaultTheme, theme, host, ...super.finalizeStyles(styles)];
  }
}
