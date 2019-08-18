import '@polymer/paper-toast/paper-toast.js';
import { GestureEventListeners } from '@polymer/polymer/lib/mixins/gesture-event-listeners.js';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin.js';
import { toastActions } from '../redux/actions.js';
import './shared-styles.js';

class ToastElement extends ReduxMixin(GestureEventListeners(PolymerElement)) {
  static get template() {
    return html`
    <style include="shared-styles flex flex-alignment">
      :host {
        display: block;
      }

      paper-toast {
        user-select: none;
      }

      paper-toast[fit-bottom] {
        width: 100%;
        min-width: 0;
        border-radius: 0;
        margin: 0;
      }

      .toast-action {
        margin-left: 24px;
        color: var(--accent-color);
        text-transform: uppercase;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        user-select: none;
      }
    </style>

    <paper-toast
      id="toast"
      duration="[[toast.duration]]"
      text="[[toast.message]]"
      opened="[[toast.visible]]"
      on-tap="_handleTap"
      fit-bottom$="[[viewport.isPhone]]"
      layout
      horizontal
      justified
      center>

      <span class="toast-action" hidden$="[[!toast.action]]" on-tap="_handleAction">
        [[toast.action.title]]
      </span>

    </paper-toast>
`;
  }

  static get is() {
    return 'toast-element';
  }

  static get properties() {
    return {
      toast: {
        type: Object,
      },
      viewport: {
        type: Object,
      },
    };
  }

  static mapStateToProps(state, _element) {
    return {
      toast: state.toast,
      viewport: state.ui.viewport,
    };
  }

  _handleTap() {
    this.toast.action && this.toast.action.callback();
    toastActions.hideToast();
  }

  _handleAction() {
    if (this.toast.action) {
      this.toast.action.callback();
      toastActions.hideToast();
    }
  }
}

window.customElements.define(ToastElement.is, ToastElement);
