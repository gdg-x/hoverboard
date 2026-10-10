import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage } from '../../config/site';
import { ThemedComponent } from '../themed-component';
import { contentStyles, markdown } from './content';

/** Access to the venue, in the organizers' words. Without it, it renders nothing. */
@customElement('accessibility-section')
export class AccessibilitySection extends ThemedComponent {
  static override styles = contentStyles;

  override render() {
    const text = attendingPage?.accessibility;
    if (!text) return nothing;
    return html`<slot name="heading"></slot>${markdown(text)}`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'accessibility-section': AccessibilitySection;
  }
}
