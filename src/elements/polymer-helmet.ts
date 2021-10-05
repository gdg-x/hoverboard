import { customElement, observe, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';

@customElement('polymer-helmet')
export class PolymerHelmet extends PolymerElement {
  static get template() {
    return html``;
  }

  @property({ type: Boolean })
  active = false;
  @property({ type: String })
  title: string;
  @property({ type: String })
  description: string;
  @property({ type: String })
  image: string;
  @property({ type: String })
  label1: string;
  @property({ type: String })
  data1: string;
  @property({ type: String })
  label2: string;
  @property({ type: String })
  data2: string;
  @property({ type: String })
  private _defaultTitle = '{$ title $}';
  @property({ type: String })
  private _defaultImage = '{$ image if image.startsWith("http") else (url + image) $}';
  @property({ type: String })
  private _defaultDescription = '{$ description $}';
  @property({ type: String })
  private _defaultLabel1 = '{$ location.label $}';
  @property({ type: String })
  private _defaultData1 = '{$ location.name $}';
  @property({ type: String })
  private _defaultLabel2 = '';
  @property({ type: String })
  private _defaultData2 = '';

  @observe('active', 'title', 'description', 'image', 'label1', 'data1', 'label2', 'data2')
  _setMetaInfo(active, title, description, image, label1, data1, label2, data2) {
    if (active) {
      const updatedTitle = title || this._defaultTitle;
      const updatedDescription = description || this._defaultDescription;
      const updatedLabel1 = label1 || this._defaultLabel1;
      const updatedData1 = data1 || this._defaultData1;
      const updatedLabel2 = label2 || this._defaultLabel2;
      const updatedData2 = data2 || this._defaultData2;
      let updatedImage = this._defaultImage;
      if (image) {
        updatedImage = image.startsWith('http') ? image : `{$ url $}${image}`;
      }
      document.title = updatedTitle;
      document
        .querySelector('meta[name="description"]')
        .setAttribute('content', updatedDescription);
      // G+
      document.querySelector('meta[itemprop="name"]').setAttribute('content', updatedTitle);
      document
        .querySelector('meta[itemprop="description"]')
        .setAttribute('content', updatedDescription);
      document.querySelector('meta[itemprop="image"]').setAttribute('content', updatedImage);
      // Facebook
      document.querySelector('meta[property="og:title"]').setAttribute('content', updatedTitle);
      document
        .querySelector('meta[property="og:description"]')
        .setAttribute('content', updatedDescription);
      document.querySelector('meta[property="og:image"]').setAttribute('content', updatedImage);
      document.querySelector('meta[property="og:url"]').setAttribute('content', this._getUrl());
      // Twitter
      document.querySelector('meta[name="twitter:title"]').setAttribute('content', updatedTitle);
      document
        .querySelector('meta[name="twitter:description"]')
        .setAttribute('content', updatedDescription);
      document.querySelector('meta[name="twitter:image"]').setAttribute('content', updatedImage);
      document.querySelector('meta[name="twitter:label1"]').setAttribute('value', updatedLabel1);
      document.querySelector('meta[name="twitter:data1"]').setAttribute('value', updatedData1);
      document.querySelector('meta[name="twitter:label2"]').setAttribute('value', updatedLabel2);
      document.querySelector('meta[name="twitter:data2"]').setAttribute('value', updatedData2);
    }
  }

  _getUrl() {
    return window.location.href;
  }
}
