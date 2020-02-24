import '@polymer/app-layout/app-scroll-effects/app-scroll-effects-behavior.js';
import { registerEffect } from '@polymer/app-layout/helpers/helpers.js';

registerEffect('transparent-scroll', {
  setUp: function () {
    this._headerToolbar = this.shadowRoot.querySelector('slot').assignedNodes({ flatten: true })
        .filter((node) => node.nodeType === Node.ELEMENT_NODE && node.localName === 'header-toolbar')[0];
  },

  run: function run(position) {
    if (this._headerToolbar) {
      if (position) {
        this._headerToolbar.removeAttribute('transparent');
      } else {
        this._headerToolbar.setAttribute('transparent', true);
      }
    }
  },

  tearDown: function tearDown() {
    delete this._headerToolbar;
  },
});
