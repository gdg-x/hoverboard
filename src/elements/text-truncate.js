import { html, PolymerElement } from '@polymer/polymer';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer.js';
import { clamp } from 'clamp-js-main';

class TextTruncate extends PolymerElement {
  static get template() {
    return html`
    <slot id="text"></slot>
`;
  }

  static get is() {
    return 'text-truncate';
  }

  static get properties() {
    return {
      lines: {
        type: String,
        value: '2',
      },
    };
  }

  ready() {
    super.ready();
    this._observer = new FlattenedNodesObserver(this.$.text, (info) => {
      const target = info.addedNodes.filter(function (node) {
        return (node.nodeType === Node.ELEMENT_NODE);
      })[0];
      clamp(target, { clamp: this._getClampValue() });
    });
  }

  _getClampValue() {
    if (!isNaN(this.lines)) {
      return parseInt(this.lines);
    }
    return this.lines;
  }
}

window.customElements.define(TextTruncate.is, TextTruncate);
