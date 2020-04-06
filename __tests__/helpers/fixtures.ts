import { render } from 'lit-html';

export const fixture = async <T extends import('lit-element').LitElement>(
  html: import('lit-html').TemplateResult
): Promise<{ element: T; shadowRoot: ShadowRoot }> => {
  render(html, document.body);
  const element = document.body.firstElementChild as T;
  if (!element || !element.shadowRoot) {
    throw new Error('Component not rendered');
  }
  await element.updateComplete;
  return { element, shadowRoot: element.shadowRoot };
};
