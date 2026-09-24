import { ReactiveController, ReactiveControllerHost } from 'lit';

export interface ClickOutsideHost extends ReactiveControllerHost, HTMLElement {}

/**
 * Reactive controller that invokes a callback whenever a click occurs
 * outside of the host element. Call `start()` while the associated UI
 * (e.g. a dropdown or popover) is open, and `stop()` once it closes.
 * Any listener still active when the host disconnects is removed
 * automatically.
 */
export class ClickOutsideController implements ReactiveController {
  private listening = false;

  constructor(
    private readonly host: ClickOutsideHost,
    private readonly onClickOutside: () => void,
  ) {
    host.addController(this);
  }

  start() {
    if (this.listening) {
      return;
    }
    this.listening = true;
    window.addEventListener('click', this.handleClick, false);
  }

  stop() {
    if (!this.listening) {
      return;
    }
    this.listening = false;
    window.removeEventListener('click', this.handleClick, false);
  }

  hostDisconnected() {
    this.stop();
  }

  private readonly handleClick = (event: MouseEvent) => {
    const isOutside = !event.composedPath().includes(this.host);
    if (isOutside) {
      this.onClickOutside();
    }
  };
}
