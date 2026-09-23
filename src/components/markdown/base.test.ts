import { describe, expect, it, vi } from 'vitest';
import { customElement } from 'lit/decorators.js';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { Markdown } from './base';

@customElement('markdown-test-subject')
class MarkdownTestSubject extends Markdown {}

declare global {
  interface HTMLElementTagNameMap {
    'markdown-test-subject': MarkdownTestSubject;
  }
}

describe('markdown base', () => {
  it('parses markdown content into HTML', async () => {
    const { element, shadowRoot } = await fixture<MarkdownTestSubject>(
      html`<markdown-test-subject
        content="# Heading

Some **bold** text"
      ></markdown-test-subject>`,
    );

    expect(shadowRoot.querySelector('.markdown-html h1')).toHaveTextContent('Heading');
    expect(shadowRoot.querySelector('.markdown-html strong')).toHaveTextContent('bold');
    expect(element.content).toContain('Heading');
  });

  it('adds target and rel attributes to links', async () => {
    const { shadowRoot } = await fixture<MarkdownTestSubject>(
      html`<markdown-test-subject content="[link](https://example.com)"></markdown-test-subject>`,
    );

    const link = shadowRoot.querySelector('.markdown-html a');
    expect(link).toHaveAttribute('href', 'https://example.com');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('warns when the content contains unsupported tags', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await fixture<MarkdownTestSubject>(
      html`<markdown-test-subject content="<div>not allowed</div>"></markdown-test-subject>`,
    );

    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid Markedown'));
    warn.mockRestore();
  });

  it('does not warn for supported content', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await fixture<MarkdownTestSubject>(
      html`<markdown-test-subject content="plain paragraph"></markdown-test-subject>`,
    );

    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('defaults content to an empty string', async () => {
    const { element } = await fixture<MarkdownTestSubject>(
      html`<markdown-test-subject></markdown-test-subject>`,
    );

    expect(element.content).toBe('');
  });
});
