import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { PreviousSpeaker } from '../models/previous-speaker';

@customElement('rotating-speakers-carousel')
export class RotatingSpeakersCarousel extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
          position: relative;
          width: 100%;
          overflow: hidden;
        }

        .carousel-container {
          display: flex;
          transition: transform 0.5s ease-in-out;
        }

        .slide {
          display: flex;
          flex: 0 0 100%;
          justify-content: center;
          gap: 24px;
        }

        .speaker-card {
          text-align: center;
          padding: 16px;
        }

        .photo {
          --lazy-image-width: 120px;
          --lazy-image-height: 120px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          border-radius: 50%;
          margin-bottom: 12px;
        }

        .name {
          font-size: 18px;
          font-weight: 500;
          margin: 8px 0 4px;
        }

        .company {
          font-size: 14px;
          color: var(--secondary-text-color);
        }

        @media (max-width: 640px) {
          .photo {
            --lazy-image-width: 80px;
            --lazy-image-height: 80px;
          }
        }
      </style>

      <div class="carousel-container" style$="transform: translateX(-[[currentSlide]]00%)">
        <template is="dom-repeat" items="[[slides]]" as="slide">
          <div class="slide">
            <template is="dom-repeat" items="[[slide]]" as="speaker">
              <div class="speaker-card">
                <lazy-image
                  class="photo"
                  src="[[speaker.photoUrl]]"
                  alt="[[speaker.name]]"
                ></lazy-image>
                <div class="name">[[speaker.name]]</div>
                <div class="company" hidden$="[[!showCompany]]">[[speaker.company]]</div>
              </div>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  @property({ type: Array })
  speakers: PreviousSpeaker[] = [];

  @property({ type: Number })
  speakersPerSlide = 4;

  @property({ type: Boolean })
  showCompany = true;

  @property({ type: Number })
  autoRotateInterval = 5000;

  @property({ type: Number })
  private currentSlide = 0;

  private intervalId?: number;

  override connectedCallback() {
    super.connectedCallback();
    this.startAutoRotate();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAutoRotate();
  }

  private startAutoRotate() {
    this.intervalId = window.setInterval(() => {
      this.nextSlide();
    }, this.autoRotateInterval);
  }

  private stopAutoRotate() {
    if (this.intervalId) {
      window.clearInterval(this.intervalId);
    }
  }

  private nextSlide() {
    const totalSlides = Math.ceil(this.speakers.length / this.speakersPerSlide);
    this.currentSlide = (this.currentSlide + 1) % totalSlides;
  }

  @computed('speakers', 'speakersPerSlide')
  get slides() {
    const slides = [];
    for (let i = 0; i < this.speakers.length; i += this.speakersPerSlide) {
      slides.push(this.speakers.slice(i, i + this.speakersPerSlide));
    }
    return slides;
  }
} 