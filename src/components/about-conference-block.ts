import { css, customElement, html } from 'lit-element';
import { ThemedElement } from './themed-element';

@customElement('about-conference-block')
export class AboutConferenceBlock extends ThemedElement {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          background: var(--tertiary-background-color);
          padding: 16px 0;
          margin-bottom: -64px;
        }

        .container {
          padding-top: 64px;
          display: grid;
          grid-gap: 32px;
          grid-template-columns: 1fr;
        }

        .categories-container {
          width: 100%;
          display: grid;
          grid-gap: 12px 12px;
          grid-template-columns: repeat(2, 1fr);
        }

        .label {
          margin-top: 4px;
        }

       .icons{
          width: 20px;
          min-height: 20px;
          margin-right: 10px;
          top: 4px;
        }

        @media (min-width: 640px) {
          .content {
            grid-gap: 64px;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }

          .categories-container {
            grid-gap: 12px;
          }
        }
      `,
    ];
  }

  render() {
    return html`
      <div class="container">
        <div>
          <h1 class="container-title">{$ callToSchedule.title $}</h1>
          <p>{$ callToSchedule.description $} <b>{$ callToSchedule.description2 $}</b></p>
          <p>{$ callToSchedule.description3 $}</p>

          <a
            href="{$ callToSchedule.url $}"
            target="_blank"
          >
            <paper-button class="cta-button animated icon-right">
              <span>{$ callToSchedule.action $}</span>
              <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
            </paper-button>
          </a>

        </div>

        <div class="categories-container">
            {% for cat in callToSchedule.categories %}
            <div class="item" layout left><iron-image class="icons" src="{$ cat.icon $}" sizing="contain"
                                                      alt="Sunny Tech Montpellier"></iron-image><span>{$ cat.title $}</span></div>
            {% endfor %}
        </div>

      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'about-conference-block': AboutConferenceBlock;
  }
}
