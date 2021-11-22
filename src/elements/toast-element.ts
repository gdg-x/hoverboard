import { customElement, property } from '@polymer/decorators';
import '@polymer/paper-toast/paper-toast';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { hideToast } from '../store/toast/actions';
import { TempAny } from '../temp-any';
import './shared-styles';

@customElement('toast-element')
export class ToastElement extends ReduxMixin(PolymerElement) {
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

  @property({ type: Object })
  private toast: { action?: { callback?: TempAny } } = {};
  @property({ type: Object })
  private viewport = {};

  stateChanged(state: RootState) {
    this.toast = state.toast;
    this.viewport = state.ui.viewport;
  }

  _handleTap() {
    this.toast.action && this.toast.action.callback();
    hideToast();
  }

  _handleAction() {
    if (this.toast.action) {
      this.toast.action.callback();
      hideToast();
    }
  }
}
