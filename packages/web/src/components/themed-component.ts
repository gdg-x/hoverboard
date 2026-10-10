import { updateWhenLocaleChanges } from '@lit/localize';
import { css, type CSSResultGroup, type CSSResultOrNative, LitElement } from 'lit';
import { theme } from '../styles/theme';
import { reducedMotion } from '../styles/shared';
// Each island loads on its own, and slice helpers such as `setLocalTime` need the store to exist.
import '../store';

const host = css`
  :host {
    display: block;
  }
`;

export class ThemedComponent extends LitElement {
  constructor() {
    super();
    updateWhenLocaleChanges(this);
  }

  // Every subclass gets the shared styles first, so it only declares its own styles. The color
  // tokens come from the `:root` style that the build writes into index.html.
  protected static override finalizeStyles(styles?: CSSResultGroup): CSSResultOrNative[] {
    return [theme, host, reducedMotion, ...super.finalizeStyles(styles)];
  }
}
