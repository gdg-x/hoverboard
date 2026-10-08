/** The value of an `aria-*` attribute from an optional boolean. `undefined` leaves it out. */
export const ariaBoolean = (value: boolean | undefined) =>
  value === undefined ? undefined : String(value);

/**
 * Stops clicks on the host of a disabled control. The inner `<button disabled>` gets no clicks, but
 * `host.click()` and clicks on the host's padding still reach listeners on the host.
 */
export const stopDisabledClicks = (host: HTMLElement & { disabled: boolean }) => {
  host.addEventListener('click', (event) => {
    if (host.disabled) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  });
};

/** The `rel` of a link: other sites opened in a new tab get no access to this page. */
export const linkRel = (target: string | undefined, rel: string | undefined) =>
  rel ?? (target === '_blank' ? 'noopener noreferrer' : undefined);
