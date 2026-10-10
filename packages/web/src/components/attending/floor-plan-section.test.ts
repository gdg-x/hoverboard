import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { FloorPlanSection } from './floor-plan-section';
import './floor-plan-section';

const config = vi.hoisted(() => ({
  floorPlan: undefined as { image: string; alt: string } | undefined,
}));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendingPage() {
    return { floorPlan: config.floorPlan };
  },
}));

const render = async () => {
  const result = await fixture<FloorPlanSection>(html`
    <floor-plan-section><h2 slot="heading">Floor plan</h2></floor-plan-section>
  `);
  await result.element.updateComplete;
  return result;
};

describe('floor-plan-section', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    config.floorPlan = undefined;
  });

  it('renders nothing without a floor plan', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot, img')).toBeNull();
  });

  it('shows the plan with its alt text, and opens it full size in a new tab', async () => {
    config.floorPlan = { image: '/images/floor-plan.svg', alt: 'The ground floor' };
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
    expect(shadowRoot.querySelector('img.plan')).toHaveAttribute('src', '/images/floor-plan.svg');
    expect(shadowRoot.querySelector('img.plan')).toHaveAttribute('alt', 'The ground floor');
    const open = shadowRoot.querySelector('.open');
    expect(open).toHaveAttribute('href', '/images/floor-plan.svg');
    expect(open).toHaveAttribute('target', '_blank');
    expect(open).toHaveTextContent('Open full size');
  });
});
