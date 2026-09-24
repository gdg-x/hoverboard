import { LitElement, render, TemplateResult } from 'lit';

interface Fixture<T> {
  element: T;
  shadowRoot: ShadowRoot;
  shadowRootForWithin: HTMLElement;
}

export const fixture = async <T extends LitElement>(html: TemplateResult): Promise<Fixture<T>> => {
  render(html, document.body);
  const element = document.body.firstElementChild as T;

  if (!element) {
    throw new Error('Component not rendered');
  }
  await element.updateComplete;
  if (!element.shadowRoot) {
    throw new Error('Shadow DOM not rendered');
  }
  const { shadowRoot } = element;
  if (shadowRoot.children.length === 0) {
    throw new Error('Component templates must render a child');
  }

  return {
    element,
    shadowRoot,
    shadowRootForWithin: shadowRoot as any as HTMLElement,
  };
};
