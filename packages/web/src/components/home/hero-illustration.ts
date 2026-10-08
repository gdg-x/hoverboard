import { html } from 'lit';

/**
 * The hero's drawing when the site has no `heroSettings.home.illustration`: a talk on a stage and
 * its audience. Lines are `currentColor` and fills are theme colors, so it follows the theme.
 */
export const defaultIllustration = html`
  <svg
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="3"
    viewBox="0 0 320 240"
  >
    <rect fill="var(--hb-color-surface-bright)" height="120" rx="12" width="240" x="40" y="24" />
    <path d="M64 56h120M64 80h176M64 104h96" />
    <circle cx="232" cy="64" fill="var(--hb-color-accent-3)" r="14" />
    <path d="M20 196h280" />
    <circle cx="110" cy="150" fill="var(--hb-color-accent-2-container)" r="12" />
    <path d="M96 196v-20a14 14 0 0 1 28 0v20" />
    <path d="M150 170h40l-6 26h-28z" fill="var(--hb-color-accent-1)" />
    <circle cx="60" cy="222" r="10" />
    <circle cx="120" cy="222" r="10" />
    <circle cx="180" cy="222" r="10" />
    <circle cx="240" cy="222" r="10" />
  </svg>
`;
