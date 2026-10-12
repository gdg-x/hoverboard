import { msg } from '@lit/localize';
import { html, nothing } from 'lit';
import { currentTime } from '../../utils/clock';
import { eventIsOver } from '../../utils/dates';

/**
 * Says the photos or videos are from past editions until this one is over, since a new edition
 * starts with last year's. The blocks load in the browser only, so this can read the clock.
 */
export const pastEditionsLabel = () =>
  eventIsOver(currentTime())
    ? nothing
    : html`<p class="band-lede past-editions">
        ${msg('From past editions', { id: 'home.past-editions' })}
      </p>`;
