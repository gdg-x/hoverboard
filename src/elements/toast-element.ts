import '@polymer/paper-toast/paper-toast';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { toastActions } from '../redux/actions';
import { State } from '../redux/store';
import { TempAny } from '../temp-any';
import './shared-styles';

class ToastElement extends ReduxMixin(PolymerElement) {
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
        on-click="_handleTap"
        fit-bottom$="[[viewport.isPhone]]"
        layout
        horizontal
        justified
        center
      >
        <span class="toast-action" hidden$="[[!toast.action]]" on-click="_handleAction">
          [[toast.action.title]]
        </span>
      </paper-toast>
    `;
  }

  static get is() {
    return 'toast-element';
  }

  private toast: { action?: { callback?: TempAny } } = {};
  private viewport = {};

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

  stateChanged(state: State) {
    this.setProperties({
      toast: state.toast,
      viewport: state.ui.viewport,
    });
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
