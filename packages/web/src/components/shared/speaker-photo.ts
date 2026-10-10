import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ThemedElement } from '../themed-element';

/** The pixel size of each `size`, which also sets the image's `width` and `height`. */
export const SPEAKER_PHOTO_SIZES = { xs: 28, s: 72, m: 120, l: 160 } as const;

export type SpeakerPhotoSize = keyof typeof SPEAKER_PHOTO_SIZES;

/**
 * A speaker's photo in one of a few sizes: `xs` next to a name, `s` in a grid of faces, `m` on a
 * card and `l` on their page. `--hb-speaker-photo-size` overrides the size, such as on a compact
 * card, and `--hb-speaker-photo-background` the color behind it while it loads.
 */
@customElement('speaker-photo')
export class SpeakerPhoto extends ThemedElement {
  static override styles = css`
    :host {
      --size: ${SPEAKER_PHOTO_SIZES.m}px;

      display: block;
      flex: none;
      inline-size: var(--hb-speaker-photo-size, var(--size));
      block-size: var(--hb-speaker-photo-size, var(--size));
    }

    :host([size='xs']) {
      --size: ${SPEAKER_PHOTO_SIZES.xs}px;
    }

    :host([size='s']) {
      --size: ${SPEAKER_PHOTO_SIZES.s}px;
    }

    :host([size='l']) {
      --size: ${SPEAKER_PHOTO_SIZES.l}px;
    }

    img {
      display: block;
      box-sizing: border-box;
      inline-size: 100%;
      block-size: 100%;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-avatar);
      background-color: var(--hb-speaker-photo-background, var(--hb-color-surface-container));
      object-fit: cover;
    }

    /* Next to a name, a plain circle. */
    :host([size='xs']) img {
      border: 0;
      border-radius: 50%;
    }

    :host([size='l']) img {
      box-shadow: var(--hb-shadow-card);
    }
  `;

  @property()
  accessor src = '';
  /** Empty when the name is next to the photo. */
  @property()
  accessor alt = '';
  @property({ reflect: true })
  accessor size: SpeakerPhotoSize = 'm';
  /** `eager` for a photo at the top of the page. */
  @property()
  accessor loading: 'lazy' | 'eager' = 'lazy';

  override render() {
    const pixels = SPEAKER_PHOTO_SIZES[this.size] ?? SPEAKER_PHOTO_SIZES.m;
    return html`<img
      src="${this.src}"
      alt="${this.alt}"
      loading="${this.loading}"
      decoding="async"
      width="${pixels}"
      height="${pixels}"
    />`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-photo': SpeakerPhoto;
  }
}
