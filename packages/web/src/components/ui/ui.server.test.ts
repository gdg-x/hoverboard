import { render } from '@lit-labs/ssr';
import { collectResult } from '@lit-labs/ssr/lib/render-result.js';
import { html, type TemplateResult } from 'lit';
import { describe, expect, it } from 'vitest';
import './hb-button';
import './hb-card';
import './hb-chip';
import './hb-dialog';
import './hb-icon-button';
import './hb-menu';
import './hb-progress';
import './hb-sticker';
import './hb-switch';
import './hb-text-field';
import './hb-toast';

const renderToString = async (template: TemplateResult) =>
  // Comments are Lit's hydration markers.
  (await collectResult(render(template))).replace(/<!--[^>]*-->/g, '');

describe('primitives on the server', () => {
  it('render buttons and links in declarative shadow roots', async () => {
    const page = await renderToString(html`
      <hb-button>Save</hb-button>
      <hb-button href="/tickets">Tickets</hb-button>
      <hb-icon-button label="Close"></hb-icon-button>
    `);

    expect(page).toContain(
      '<template shadowroot="open" shadowrootmode="open" shadowrootdelegatesfocus>',
    );
    expect(page).toMatch(/<button\s+class="button state"\s+type="button"/);
    expect(page).toMatch(/<a\s+class="button state"\s+href="\/tickets"/);
    expect(page).toMatch(/aria-label="Close"/);
  });

  it('render labels, chips, stickers and cards', async () => {
    const page = await renderToString(html`
      <hb-chip filter selected>Web</hb-chip>
      <hb-sticker tilt="4">Live now</hb-sticker>
      <hb-card href="/speakers/ada" label="Ada Lovelace">Ada</hb-card>
    `);

    expect(page).toMatch(/aria-pressed="true"/);
    expect(page).toContain('--hb-sticker-tilt:4deg');
    expect(page).toMatch(/<a\s+class="cover"\s+href="\/speakers\/ada"\s+aria-label="Ada Lovelace"/);
  });

  it('render form controls with their state', async () => {
    const page = await renderToString(html`
      <hb-text-field label="Email" error="Enter an email" required></hb-text-field>
      <hb-switch label="Notifications" checked></hb-switch>
      <hb-progress></hb-progress>
    `);

    expect(page).toMatch(/<label\s+for="control"\s*>Email<\/label>/);
    expect(page).toMatch(/aria-invalid="true"/);
    expect(page).toMatch(/role="switch"[^>]*checked/);
    expect(page).toMatch(/<progress\s+aria-label="Loading..."\s+max="1"\s*>/);
  });

  it('render dialogs, menus and toasts closed', async () => {
    const page = await renderToString(html`
      <hb-dialog heading="Subscribe" open></hb-dialog>
      <hb-menu><button slot="trigger">More</button></hb-menu>
      <hb-toast open>Saved</hb-toast>
    `);

    expect(page).toMatch(/<dialog\s+aria-labelledby="heading"\s*>/);
    expect(page).toMatch(/popover="manual"\s+role="menu"/);
    expect(page).not.toContain('data-popover-open');
  });
});
