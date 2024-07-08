import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { footerRelBlock, notifications, subscribeNote } from '../utils/data';
import './subscribe-form-footer';

@customElement('footer-rel')
export class FooterRel extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          border-top: 1px solid var(--border-light-color);
          border-bottom: 1px solid var(--border-light-color);
          margin: 0 20px 0 20px;
          overflow: auto;
          overflow-y: hidden;
          padding: 10px 0;
          color: var(--footer-text-color);
          display: grid;
          grid-gap: 16px;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        }

        .col-heading {
          font-size: 14px;
          font-weight: 500;
          line-height: 21px;
          margin-top: 25px;
          margin-bottom: 10px;
        }

        .nav {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        a {
          color: var(--footer-text-color);
          padding-bottom: 2px;
          text-decoration: none;
          pointer-events: all;
        }

        li {
          display: list-item;
          line-height: 25px;
          pointer-events: none;
        }

        li:hover {
          text-decoration: underline;
        }

        @media (min-width: 768px) {
          :host {
            margin: 15px 0;
            padding: 30px 0;
          }

          .col-heading {
            font-size: 18px;
            margin-top: 0;
          }
        }
      </style>

      <template is="dom-repeat" items="[[footerRelBlock]]" as="footerRel">
        <div class="col" layout vertical wrap flex-auto>
          <div class="col-heading">[[footerRel.title]]</div>
          <ul class="nav">
            <template is="dom-repeat" items="[[footerRel.links]]" as="link">
              <li>
                <template is="dom-if" if="[[!link.newTab]]">
                  <a href="[[link.url]]">[[link.name]]</a>
                </template>
                <template is="dom-if" if="[[link.newTab]]">
                  <a href="[[link.url]]" target="_blank" rel="noopener noreferrer">[[link.name]]</a>
                </template>
              </li>
            </template>
          </ul>
        </div>
      </template>
    `;
  }

  @property({ type: Array })
  private footerRelBlock = footerRelBlock;
  @property()
  private subscribeNote = subscribeNote;
  @property({ type: Object })
  private notifications = notifications;
}
