import { Success } from '@abraham/remotedata';
import { msg, str } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { type Reaction, REACTION_EMOJI, REACTIONS, type ReactionId } from '../../models/reaction';
import type { Session } from '../../models/session';
import { store } from '../../store';
import { openProfileDialog, openSigninDialog } from '../../store/dialogs';
import {
  type ProfilesState,
  selectOwnProfileState,
  unwatchProfiles,
  watchProfiles,
} from '../../store/profiles';
import {
  type ReactionsState,
  selectOwnReactionsState,
  setUserReactions,
  toggled,
  unwatchSessionReactions,
  watchSessionReactions,
} from '../../store/reactions';
import { queueComplexSnackbar } from '../../store/snackbars';
import type { UserState } from '../../store/user';
import { confetti } from '../../utils/confetti';
import { getLocale } from '../../utils/localization';
import { acceptingReactions } from '../../utils/reactions';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';
import '../ui/hb-popover';
import type { HbPopover } from '../ui/hb-popover';
import { ThemedComponent } from '../themed-component';

/** Reactors named in a chip's label, newest first. The rest are counted. */
const NAMED = 2;
const ONE_MINUTE_MS = 60 * 1000;

export const reactionLabel = (reaction: ReactionId): string =>
  ({
    applause: msg('Applause', { id: 'reactions.applause' }),
    love: msg('Love', { id: 'reactions.love' }),
    insightful: msg('Insightful', { id: 'reactions.insightful' }),
    'mind-blown': msg('Mind blown', { id: 'reactions.mind-blown' }),
    funny: msg('Funny', { id: 'reactions.funny' }),
  })[reaction];

/** Who reacted with `reaction`: the newest named, the rest counted, or only a count without names. */
export const reactorsLabel = (reaction: ReactionId, names: string[], count: number): string => {
  const label = reactionLabel(reaction);
  if (!names.length) {
    return count === 1
      ? msg(str`1 person reacted with ${label}`, { id: 'reactions.count-one' })
      : msg(str`${count} people reacted with ${label}`, { id: 'reactions.count-many' });
  }
  const others = count - names.length;
  const who = new Intl.ListFormat(getLocale(), { type: 'conjunction' }).format([
    ...names,
    ...(others === 1 ? [msg('1 other', { id: 'reactions.others-one' })] : []),
    ...(others > 1 ? [msg(str`${others} others`, { id: 'reactions.others-many' })] : []),
  ]);
  return msg(str`${who} reacted with ${label}`, { id: 'reactions.who' });
};

/**
 * Signed-in visitors' reactions to a session: a chip with a count for each reaction someone added,
 * and a button to add one. Until a week after the session ends; then visitors can only take theirs
 * away. Reactions load in the browser, so the first render shows only the button, as the server's.
 */
@customElement('session-reactions')
export class SessionReactions extends ThemedComponent {
  static override styles = css`
    :host {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--hb-space-2);
      min-block-size: 40px;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: var(--hb-space-1);
      min-block-size: 32px;
      padding: 0 var(--hb-space-3);
      border: var(--hb-border-width) solid var(--hb-color-outline-variant);
      border-radius: 999px;
      background: var(--hb-color-surface);
      color: var(--hb-color-on-surface);
      font: inherit;
      font-variant-numeric: tabular-nums;
      cursor: pointer;
    }

    .chip[aria-pressed='true'] {
      border-color: var(--hb-color-primary);
      background: var(--hb-color-primary-container);
      color: var(--hb-color-on-primary-container);
    }

    .chip[aria-disabled='true'] {
      cursor: default;
    }

    .chip:focus-visible,
    .picker button:focus-visible {
      outline: 2px solid var(--hb-color-focus);
      outline-offset: 2px;
    }

    .picker {
      display: flex;
      gap: var(--hb-space-1);
      padding: var(--hb-space-2);
    }

    .picker button {
      inline-size: 40px;
      block-size: 40px;
      border: 0;
      border-radius: var(--hb-radius-s);
      background: none;
      font-size: 1.4rem;
      cursor: pointer;
    }

    .picker button[aria-pressed='true'] {
      background: var(--hb-color-primary-container);
    }

    @media (forced-colors: active) {
      .chip[aria-pressed='true'],
      .picker button[aria-pressed='true'] {
        border: 2px solid Highlight;
      }
    }
  `;

  @property({ attribute: false })
  accessor session: Pick<Session, 'id' | 'title' | 'day' | 'startTime' | 'endTime'> | undefined;

  @fromStore((state) => state.user)
  private accessor user!: UserState;
  @fromStore((state) => state.reactions.bySession)
  private accessor bySession!: ReactionsState['bySession'];
  @fromStore(selectOwnReactionsState)
  private accessor ownReactions!: ReactionsState['own'];
  @fromStore(selectOwnProfileState)
  private accessor profile!: ProfilesState['own'];
  @fromStore((state) => state.profiles.byId)
  private accessor profiles!: ProfilesState['byId'];

  // Open on the server and the first render, which can't know the time. Checked once hydrated.
  @state()
  private accessor open = true;
  private timer: ReturnType<typeof setInterval> | undefined;
  private watched: string | undefined;

  override firstUpdated() {
    this.checkOpen();
    this.timer = setInterval(() => this.checkOpen(), ONE_MINUTE_MS);
    this.watch();
  }

  override updated(changed: PropertyValues) {
    if (changed.has('session') && this.hasUpdated) this.watch();
    if (changed.has('bySession') || changed.has('session')) watchProfiles(this.namedReactors());
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    clearInterval(this.timer);
    if (this.watched) unwatchSessionReactions(this.watched);
    this.watched = undefined;
    unwatchProfiles();
  }

  private watch() {
    const id = this.session?.id;
    if (id === this.watched) return;
    if (this.watched) unwatchSessionReactions(this.watched);
    this.watched = id;
    if (id) watchSessionReactions(id);
  }

  private checkOpen() {
    this.open = !this.session || acceptingReactions(this.session);
  }

  private get list(): Reaction[] {
    const reactions = this.session && this.bySession[this.session.id];
    return reactions instanceof Success ? reactions.data : [];
  }

  private get own(): ReactionId[] {
    const own = this.ownReactions;
    return own instanceof Success && this.session ? (own.data[this.session.id] ?? []) : [];
  }

  /** The users each chip names: the newest reactors of each reaction. */
  private namedReactors(): string[] {
    const ids = REACTIONS.flatMap((reaction) =>
      this.list
        .filter(({ reactions }) => reactions.includes(reaction))
        .slice(0, NAMED)
        .map(({ userId }) => userId),
    );
    return [...new Set(ids)];
  }

  override render() {
    const counts = REACTIONS.map((reaction) => {
      const reactors = this.list.filter(({ reactions }) => reactions.includes(reaction));
      return { reaction, reactors };
    }).filter(({ reactors }) => reactors.length);

    return html`
      ${counts.map(({ reaction, reactors }) => {
        const names = reactors
          .slice(0, NAMED)
          .flatMap(({ userId }) => this.profiles[userId]?.name ?? []);
        const label = reactorsLabel(reaction, names, reactors.length);
        const mine = this.own.includes(reaction);
        const closed = !this.open && !mine;
        return html`
          <button
            class="chip"
            type="button"
            aria-pressed="${String(mine)}"
            aria-disabled="${closed ? 'true' : nothing}"
            aria-label="${label}"
            title="${label}"
            @click="${(event: Event) => (closed ? undefined : this.react(reaction, event))}"
          >
            <span aria-hidden="true">${REACTION_EMOJI[reaction]}</span>
            <span aria-hidden="true">${reactors.length}</span>
          </button>
        `;
      })}
      ${this.open ? this.renderPicker() : nothing}
    `;
  }

  private renderPicker() {
    return html`
      <hb-popover>
        <hb-icon-button slot="trigger" label="${msg('Add a reaction', { id: 'reactions.add' })}">
          <hoverboard-icon name="add-reaction"></hoverboard-icon>
        </hb-icon-button>
        <div
          class="picker"
          role="group"
          aria-label="${msg('Reactions', { id: 'reactions.label' })}"
        >
          ${REACTIONS.map((reaction) => {
            const label = reactionLabel(reaction);
            return html`
              <button
                type="button"
                aria-pressed="${String(this.own.includes(reaction))}"
                aria-label="${label}"
                title="${label}"
                @click="${(event: Event) => this.pick(reaction, event)}"
              >
                ${REACTION_EMOJI[reaction]}
              </button>
            `;
          })}
        </div>
      </hb-popover>
    `;
  }

  private pick(reaction: ReactionId, event: Event) {
    this.renderRoot.querySelector<HbPopover>('hb-popover')?.close({ focusTrigger: true });
    this.react(reaction, event);
  }

  private react(reaction: ReactionId, event: Event) {
    const sessionId = this.session?.id;
    if (!sessionId) return;
    if (!(this.user instanceof Success)) {
      store.dispatch(
        queueComplexSnackbar({
          label: msg('Sign in to react to sessions', { id: 'reactions.signed-out' }),
          action: {
            title: msg('Sign in', { id: 'common.sign-in' }),
            callback: () => openSigninDialog(),
          },
        }),
      );
      return;
    }
    if (!(this.profile instanceof Success && this.profile.data)) {
      openProfileDialog({ sessionId, reaction });
      return;
    }
    const next = toggled(this.own, reaction);
    setUserReactions(sessionId, this.user.data.uid, next);
    if (next.includes(reaction)) confetti(event.currentTarget as Element);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'session-reactions': SessionReactions;
  }
}
