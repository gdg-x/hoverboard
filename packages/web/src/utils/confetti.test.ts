import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confetti } from './confetti';

const button = () => {
  const element = document.createElement('button');
  document.body.append(element);
  return element;
};

describe('confetti', () => {
  let animate: ReturnType<typeof vi.spyOn>;
  let finish: () => void;

  beforeEach(() => {
    const finished = new Promise<void>((resolve) => (finish = resolve));
    animate = vi.spyOn(Element.prototype, 'animate').mockReturnValue({ finished } as never);
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: false } as never);
  });

  afterEach(() => {
    document.body.replaceChildren();
    delete document.documentElement.dataset['decorations'];
    vi.restoreAllMocks();
  });

  it('bursts pieces in the accent colors, hidden from assistive tech, then cleans up', async () => {
    confetti(button());

    const burst = document.body.lastElementChild as HTMLElement;
    expect(burst).toHaveAttribute('aria-hidden', 'true');
    expect(burst.children).toHaveLength(14);
    expect((burst.children[0] as HTMLElement).style.background).toBe('var(--hb-color-accent-1)');
    expect(animate).toHaveBeenCalledTimes(14);

    finish();
    await vi.waitFor(() => expect(burst.isConnected).toBe(false));
  });

  it('does nothing with decorations off', () => {
    document.documentElement.dataset['decorations'] = 'off';
    confetti(button());

    expect(animate).not.toHaveBeenCalled();
    expect(document.body.children).toHaveLength(1);
  });

  it('does nothing with reduced motion', () => {
    vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as never);
    confetti(button());

    expect(animate).not.toHaveBeenCalled();
  });
});
