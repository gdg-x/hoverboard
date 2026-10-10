import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SocialLinks } from './social-links';
import './social-links';

const socials = [
  { icon: 'github', link: 'https://github.com/ada', name: 'GitHub' },
  { icon: 'linkedin', link: 'https://linkedin.com/in/ada', name: 'LinkedIn' },
];

const render = async (props: Partial<SocialLinks>) => {
  const result = await fixture<SocialLinks>(html`<social-links></social-links>`);
  Object.assign(result.element, { socials, ...props });
  await result.element.updateComplete;
  return { ...result, links: [...result.shadowRoot.querySelectorAll('hb-icon-button')] };
};

describe('social-links', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('links each profile in a new tab, named after its network', async () => {
    const { links } = await render({});

    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      'https://github.com/ada',
      'https://linkedin.com/in/ada',
    ]);
    expect(links[0]).toHaveAttribute('target', '_blank');
    expect(links[0]).toHaveAttribute('label', 'GitHub');
    expect(links[0]).toHaveAttribute('variant', 'standard');
    expect(links[0]!.querySelector('hoverboard-icon')).toHaveAttribute('name', 'github');
  });

  it("adds the owner's name when several people share a page", async () => {
    const { links } = await render({ owner: 'Ada Lovelace' });

    expect(links[1]).toHaveAttribute('label', 'LinkedIn: Ada Lovelace');
  });

  it('names the list and passes the button look on', async () => {
    const { shadowRoot, links } = await render({ label: 'Social links', variant: 'tonal' });

    expect(shadowRoot.querySelector('ul')).toHaveAttribute('aria-label', 'Social links');
    expect(links[0]).toHaveAttribute('variant', 'tonal');
  });

  it('renders no list without profiles', async () => {
    const element = document.createElement('social-links');
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('ul')).toBeNull();
    element.remove();
  });
});
