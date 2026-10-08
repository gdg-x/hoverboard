import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import '@material/web/progress/linear-progress.js';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/shared/content-loader';
import '../components/shared/hoverboard-icon';
import '../components/shared/previous-speakers-block';
import type { SpeakerWithTags } from '../models/speaker';
import { goto, sessionPath } from '../utils/navigation';
import { store } from '../store';
import { selectSpeaker } from '../store/speakers/selectors';
import { type SpeakersState, selectSpeakersState } from '../store/speakers';
import { updateImageMetadata } from '../utils/metadata';
import { variableColor } from '../utils/styles';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

// `speaker.sessions` is not currently populated by any action/selector/state for
// `SpeakerWithTags`, so this augmentation and helper keep the (currently always-empty)
// "additional sessions" section fully typed and ready to render the moment real
// session data is supplied, without changing today's output.
interface SpeakerSessionSummary {
  id: string;
  title: string;
  dateReadable?: string;
  startTime?: string;
  endTime?: string;
  track?: { title?: string };
  tags?: string[];
}

type SpeakerWithSessions = SpeakerWithTags & { sessions?: SpeakerSessionSummary[] };

@customElement('speaker-page')
export class SpeakerPage extends ThemedElement {
  static override styles = css`
    :host {
      background: var(--primary-background-color);
      box-shadow: var(--box-shadow);
      color: var(--primary-text-color);
      display: block;
      height: 100%;
      margin: 0;
      width: 100%;
    }

    .content {
      position: relative;
      font-size: 15px;
      line-height: 1.87;
    }

    .photo {
      margin-right: 16px;
      --lazy-image-width: 96px;
      --lazy-image-height: 96px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      overflow: hidden;
      border-radius: 50%;
      background-color: var(--contrast-additional-background-color);
      transform: translateZ(0);
      flex-shrink: 0;
    }

    .name {
      line-height: 1.2;
      flex: 1;
      flex-basis: 1px;
    }

    .subtitle {
      font-size: 16px;
      color: var(--secondary-text-color);
    }

    .badge:not(:last-of-type)::after {
      margin-left: -4px;
      content: ',';
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      margin-top: 8px;
    }

    .star-rating {
      display: inline-block;
      vertical-align: middle;
    }

    .meta-info {
      line-height: 1.6;
    }

    .description {
      margin: 24px 0 32px;
      max-width: 700px;
    }

    .action {
      margin-right: 16px;
      color: var(--secondary-text-color);
      cursor: pointer;
      user-select: none;
    }

    .action hoverboard-icon {
      margin-right: 4px;
      width: 18px;
      height: 18px;
    }

    .additional-sections {
      margin-top: 32px;
    }

    .actions,
    .header-content,
    .section-content {
      display: flex;
    }

    .header-content,
    .section-content {
      align-items: center;
    }

    .section {
      margin-top: 16px;
      display: block;
      color: var(--primary-text-color);
      cursor: pointer;
    }

    .section-details {
      flex: 1;
      flex-basis: 1px;
    }

    .section-photo {
      margin-right: 16px;
      width: 48px;
      height: 48px;
      background-color: var(--secondary-background-color);
      border-radius: 50%;
      overflow: hidden;
      transform: translateZ(0);
    }

    .section-primary-text {
      margin-bottom: 4px;
      line-height: 1.2;
    }

    .section-secondary-text {
      font-size: 12px;
      line-height: 1;
    }

    .progress {
      width: 100%;
      --md-linear-progress-active-indicator-color: var(--default-primary-color);
      --md-linear-progress-track-color: var(--default-primary-color);
    }
  `;

  @property({ type: Object })
  accessor speaker: SpeakerWithTags | undefined;
  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;

  @property({ attribute: false })
  accessor speakerId: string | undefined;

  // Runs on the server too, so the page renders the speaker. Side effects wait for `updated`.
  override willUpdate(changed: Map<string, unknown>) {
    if ((changed.has('speakers') || changed.has('speakerId')) && this.isLoaded) {
      this.speaker = selectSpeaker(store.getState(), this.speakerId!);
    }
  }

  override updated(changed: Map<string, unknown>) {
    if ((changed.has('speakers') || changed.has('speakerId')) && this.isLoaded) {
      if (!this.speaker) {
        goto('/404');
      } else {
        updateImageMetadata(this.speaker.name, this.speaker.bio, {
          image: this.speaker.photoUrl,
          imageAlt: this.speaker.name,
        });
      }
    }
  }

  private get isLoaded() {
    return !!this.speakerId && this.speakers instanceof Success;
  }

  private get contentLoaderVisibility() {
    return !!this.speaker;
  }

  private get subtitle() {
    return [this.speaker?.country, this.speaker?.pronouns].filter(Boolean).join(' • ');
  }

  private get companyInfo() {
    return [this.speaker?.title, this.speaker?.company].filter(Boolean).join(', ');
  }

  private get sessions(): SpeakerSessionSummary[] {
    return (this.speaker as SpeakerWithSessions | undefined)?.sessions ?? [];
  }

  private getVariableColor(value: string) {
    return variableColor(value);
  }

  private sessionUrl(id: string) {
    return sessionPath(id);
  }

  override render() {
    const speaker = this.speaker;
    const sessions = this.sessions;

    return html`
      <simple-hero page="speakers">
        <div class="dialog-container header-content">
          <img
            loading="lazy"
            decoding="async"
            class="photo"
            src=${speaker?.photoUrl ?? ''}
            alt=${speaker?.name ?? ''}
          />
          <div>
            <h2 class="name">${speaker?.name ?? ''}</h2>
            <div class="subtitle">${this.subtitle}</div>
          </div>
        </div>
      </simple-hero>

      <md-linear-progress
        class="progress"
        indeterminate
        ?hidden=${this.contentLoaderVisibility}
      ></md-linear-progress>

      <content-loader
        class="container"
        card-padding="32px"
        card-height="400px"
        horizontal-position="50%"
        border-radius="4px"
        box-shadow="var(--box-shadow)"
        items-count="1"
        ?hidden=${this.contentLoaderVisibility}
      ></content-loader>

      <div class="container content">
        <h3 class="meta-info">${this.companyInfo}</h3>
        ${
          speaker?.badges?.length
            ? html`
                <h3 class="meta-info">
                  ${speaker.badges.map(
                    (badge) => html`
                      <a
                        class="badge"
                        href=${badge.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        title=${badge.description}
                      >
                        ${badge.description}
                      </a>
                    `,
                  )}
                </h3>
              `
            : nothing
        }

        <short-markdown class="description" .content=${speaker?.bio ?? ''}></short-markdown>

        <div class="actions">
          ${speaker?.socials?.map(
            (social) => html`
              <a class="action" href=${social.link} target="_blank" rel="noopener noreferrer">
                <hoverboard-icon name=${social.icon}></hoverboard-icon>
              </a>
            `,
          )}
        </div>

        ${
          sessions.length
            ? html`
                <div class="additional-sections">
                  <h3>${msg('Sessions', { id: 'common.sessions' })}</h3>

                  ${sessions.map(
                    (session) => html`
                      <a href=${this.sessionUrl(session.id)} class="section">
                        <div class="section-content">
                          <div class="section-details">
                            <div class="section-primary-text">${session.title}</div>
                            ${
                              session.dateReadable
                                ? html`<div class="section-secondary-text">
                                    ${session.dateReadable}, ${session.startTime} -
                                    ${session.endTime}
                                  </div>`
                                : nothing
                            }
                            ${
                              session.track?.title
                                ? html`<div class="section-secondary-text">
                                    ${session.track.title}
                                  </div>`
                                : nothing
                            }
                            ${
                              session.tags?.length
                                ? html`<div class="tags">
                                    ${session.tags.map(
                                      (tag) =>
                                        html`<span
                                          class="tag"
                                          style="color: ${this.getVariableColor(tag)}"
                                          >${tag}</span
                                        >`,
                                    )}
                                  </div>`
                                : nothing
                            }
                          </div>
                        </div>
                      </a>
                    `,
                  )}
                </div>
              `
            : nothing
        }
      </div>

      ${__HB_FEATURES__.previousSpeakers ? html`<previous-speakers-block></previous-speakers-block>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-page': SpeakerPage;
  }
}
