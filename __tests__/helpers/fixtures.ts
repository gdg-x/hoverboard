import { render } from 'lit-html';

export const fixture = async <T extends import('lit-element').LitElement>(
  html: import('lit-html').TemplateResult
): Promise<{ element: T; shadowRoot: ShadowRoot; container: HTMLDivElement }> => {
  render(html, document.body);
  const element = document.body.firstElementChild as T;

  if (!element) {
    throw new Error('Component not rendered');
  }
  await element.updateComplete;
  if (!element.shadowRoot) {
    throw new Error('ShadowDOM not rendered');
  }
  if (!element.shadowRoot.firstElementChild?.classList.contains('container')) {
    throw new Error('Container not rendered');
  }

  return {
    element,
    shadowRoot: element.shadowRoot,
    container: element.shadowRoot.firstElementChild as HTMLDivElement,
  };
};
