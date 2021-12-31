import { Success } from '@abraham/remotedata';
import { customElement, property } from '@polymer/decorators';
import '@polymer/paper-toast/paper-toast';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { hideToast } from '../store/toast/actions';
import { initialToastState } from '../store/toast/state';
import { initialUiState } from '../store/ui/state';
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
        duration="[[toast.data.duration]]"
        text="[[toast.data.message]]"
        opened="[[toast.data.visible]]"
        on-click="_handleTap"
        fit-bottom$="[[viewport.isPhone]]"
        layout
        horizontal
        justified
        center
      >
        <span class="toast-action" hidden$="[[!toast.data.action]]" on-click="_handleAction">
          [[toast.data.action.title]]
        </span>
      </paper-toast>
    `;
  }

  @property({ type: Object })
  private toast = initialToastState;
  @property({ type: Object })
  private viewport = initialUiState.viewport;

  override stateChanged(state: RootState) {
    this.toast = state.toast;
    this.viewport = state.ui.viewport;
  }

  _handleTap() {
    if (this.toast instanceof Success) {
      this.toast.data.action && this.toast.data.action.callback();
      hideToast();
    }
  }

  _handleAction() {
    if (this.toast instanceof Success && this.toast.data.action) {
      this.toast.data.action.callback();
      hideToast();
    }
  }
}
