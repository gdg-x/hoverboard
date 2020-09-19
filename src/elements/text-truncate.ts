import { customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { FlattenedNodesObserver } from '@polymer/polymer/lib/utils/flattened-nodes-observer';
import { clamp } from 'clamp-js-main';

@customElement('text-truncate')
export class TextTruncate extends PolymerElement {
  static get template() {
    return html` <slot id="text"></slot> `;
  }

  @property({ type: Number })
  lines = 2;

  @property({ type: Object })
  private _observer: FlattenedNodesObserver;

  ready() {
    super.ready();
    this._observer = new FlattenedNodesObserver(this.$.text, (info) => {
      const target = info.addedNodes.filter(function (node) {
        return node.nodeType === Node.ELEMENT_NODE;
      })[0];
      clamp(target, { clamp: this.lines });
    });
  }
}
