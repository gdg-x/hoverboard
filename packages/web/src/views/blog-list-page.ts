import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/shared/posts-list';
import '../components/ui/hb-progress';
import { type BlogState, selectBlogPosts } from '../store/blog';
import { pageInner } from '../styles/page';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

/** Every blog post as a card, newest first, with the first one larger. */
@customElement('blog-list-page')
export class BlogListPage extends ThemedElement {
  static override styles = pageInner;

  private readonly metadata = new PageMetadataController(this, 'blog');

  @fromStore((state) => selectBlogPosts(state))
  accessor posts!: BlogState;

  override render() {
    const posts = this.posts instanceof Success ? this.posts.data : [];

    return html`
      <simple-hero page="blog"></simple-hero>

      <hb-progress ?hidden="${!(this.posts instanceof Pending)}"></hb-progress>

      <div class="inner">
        ${
          this.posts instanceof Failure
            ? html`<p>${msg('Error loading posts.', { id: 'pages.blog-list.error' })}</p>`
            : nothing
        }
        <posts-list featured .posts="${posts}"></posts-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'blog-list-page': BlogListPage;
  }
}
