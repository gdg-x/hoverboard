// Positions a sliding selection-bar indicator under the currently selected tab, replicating the
// animated `--paper-tabs-selection-bar-color` bar from the retired `@polymer/paper-tabs`
// component. `bar` is expected to be an absolutely-positioned child of the same relatively
// positioned container as `selected`, so `offsetLeft`/`offsetWidth` are already relative to it.
export function updateSelectionBar(
  bar: HTMLElement | null | undefined,
  selected: HTMLElement | null | undefined,
): void {
  if (!bar) {
    return;
  }
  if (!selected) {
    bar.style.width = '0px';
    return;
  }
  bar.style.left = `${selected.offsetLeft}px`;
  bar.style.width = `${selected.offsetWidth}px`;
}
