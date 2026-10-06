import { css, html, LitElement, svg } from 'lit';
import { customElement, property } from 'lit/decorators.js';

export interface StarRatingChangeDetail {
  rating: number;
  value: number;
}

const STAR_ICON = svg`<svg viewBox="0 0 24 24" aria-hidden="true">
  <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"></path>
</svg>`;

@customElement('star-rating')
export class StarRating extends LitElement {
  static override styles = css`
    :host {
      display: inline-block;
      --star-color: #faca43;
      --empty-color: #bebebe;
      --detail-color: #999;
    }

    .stars {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: bottom;
    }

    button,
    .readonly-star {
      width: 31px;
      height: 31px;
      padding: 0;
      border: 0;
      margin: 0;
      color: var(--star-color);
      background: transparent;
      line-height: 0;
    }

    button {
      cursor: pointer;
    }

    button:focus-visible {
      outline: 2px solid var(--focused-color, var(--star-color));
      outline-offset: 2px;
      border-radius: 50%;
    }

    svg {
      width: 19px;
      height: 19px;
      fill: currentcolor;
    }

    .blank-star {
      color: var(--empty-color);
    }

    .details {
      margin-left: 0.4em;
      color: var(--detail-color);
      font-family: Roboto, Noto, sans-serif;
      -webkit-font-smoothing: antialiased;
      font-size: 15px;
      font-weight: 400;
      line-height: 19px;
      vertical-align: middle;
    }
  `;

  private _rating = 0;

  @property({ type: Number, reflect: true })
  get rating() {
    return this._rating;
  }

  set rating(value: number) {
    const oldRating = this._rating;
    this._rating = this.normalizeRating(Number(value));
    this.requestUpdate('rating', oldRating);
  }

  @property({ type: Boolean, attribute: 'read-only' })
  readOnly = false;

  @property({ type: Boolean })
  details = false;

  @property({ type: Number })
  votes = 0;

  private readonly maxRating = 5;

  override render() {
    return html`
      <div class="stars" role=${this.readOnly ? 'img' : 'group'} aria-label=${this.ratingLabel}>
        ${Array.from({ length: this.maxRating }, (_, index) => this.renderStar(index + 1))}
        ${
          this.showDetails
            ? html`<span class="details">
                <span>${this.rating}</span>
                <span>${this.votes ? `(${this.votes} votes)` : '(No votes)'}</span>
              </span>`
            : ''
        }
      </div>
    `;
  }

  private renderStar(value: number) {
    const selected = value <= this.rating;
    const className = selected ? 'star' : 'blank-star';

    if (this.readOnly) {
      return html`<span class="readonly-star ${className}">${STAR_ICON}</span>`;
    }

    return html`
      <button
        class=${className}
        type="button"
        aria-label=${`Rate ${value} out of ${this.maxRating}`}
        aria-pressed=${selected ? 'true' : 'false'}
        @click=${() => this.changeRating(value)}
        @keydown=${(event: KeyboardEvent) => this.onKeyDown(event, value)}
      >
        ${STAR_ICON}
      </button>
    `;
  }

  private get ratingLabel() {
    return `${this.rating} out of ${this.maxRating} stars`;
  }

  private get showDetails() {
    return this.details && this.readOnly;
  }

  private onKeyDown(event: KeyboardEvent, value: number) {
    let nextRating: number | undefined;

    switch (event.key) {
      case 'Enter':
      case ' ':
      case 'Spacebar':
        nextRating = value;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        nextRating = this.rating + 1;
        break;
      case 'ArrowLeft':
      case 'ArrowDown':
        nextRating = this.rating - 1;
        break;
      case 'Home':
        nextRating = 1;
        break;
      case 'End':
        nextRating = this.maxRating;
        break;
      default:
        return;
    }

    event.preventDefault();
    this.changeRating(nextRating);
  }

  private changeRating(rating: number) {
    const normalizedRating = this.normalizeRating(rating);
    if (this.rating === normalizedRating) {
      return;
    }

    this.rating = normalizedRating;
    this.dispatchEvent(
      new CustomEvent<StarRatingChangeDetail>('rating-changed', {
        bubbles: true,
        composed: true,
        detail: {
          rating: normalizedRating,
          value: normalizedRating,
        },
      }),
    );
  }

  private normalizeRating(rating: number) {
    if (!Number.isFinite(rating)) {
      return 0;
    }

    return Math.min(this.maxRating, Math.max(0, Math.trunc(rating)));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'star-rating': StarRating;
  }
}
