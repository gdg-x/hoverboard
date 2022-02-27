import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/markdown/short-markdown';
import '../components/text-truncate';
import { Post } from '../models/post';
import { router } from '../router';
import { getDate } from '../utils/dates';
import './shared-styles';

@customElement('posts-list')
export class PostsList extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
        :host {
          display: block;
        }

        .post {
          padding: 24px 0;
          display: block;
          color: var(--primary-text-color);
        }

        .post:not(:last-of-type) {
          border-bottom: 1px dotted var(--divider-color);
        }

        .image {
          margin-right: 24px;
          --lazy-image-width: 64px;
          --lazy-image-height: 64px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          border-radius: var(--border-radius);
        }

        .details {
          height: 100%;
        }

        .title {
          line-height: 1.2;
        }

        .description {
          padding-top: 8px;
          color: var(--secondary-text-color);
        }

        .date {
          font-size: 12px;
          text-transform: uppercase;
          color: var(--secondary-text-color);
        }

        @media (min-width: 640px) {
          .image {
            --lazy-image-width: 128px;
            --lazy-image-height: 128px;
          }
        }
      </style>

      <template is="dom-repeat" items="[[posts]]" as="post">
        <a href$="[[postUrl(post.id)]]" class="post" layout horizontal>
          <lazy-image
            class="image"
            src="[[post.image]]"
            alt="[[post.title]]"
            style$="background-color: [[post.backgroundColor]];"
            hidden$="[[!post.image]]"
          ></lazy-image>
          <div flex>
            <div class="details" layout vertical justified>
              <div>
                <text-truncate lines="2">
                  <h2 class="title">[[post.title]]</h2>
                </text-truncate>
                <text-truncate lines="3">
                  <short-markdown class="description" content="[[post.brief]]"></short-markdown>
                </text-truncate>
              </div>
              <span class="date">[[getDate(post.published)]]</span>
            </div>
          </div>
        </a>
      </template>
    `;
  }

  @property({ type: Array })
  posts: Post[] = [];

  postUrl(id: string) {
    return router.urlForName('post-page', { id });
  }

  getDate(date: string) {
    return getDate(date);
  }
}
