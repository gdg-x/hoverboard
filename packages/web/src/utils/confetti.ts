const COLORS = [1, 2, 3, 4].map((accent) => `var(--hb-color-accent-${accent})`);
const PIECES = 14;
const DURATION_MS = 700;

/**
 * A short burst of confetti in the accent colors from the middle of `from`, such as a bookmark
 * button. Nothing happens with `theme.decorations` off or with reduced motion.
 */
export const confetti = (from: Element): void => {
  if (
    document.documentElement.dataset['decorations'] === 'off' ||
    typeof document.body.animate !== 'function' ||
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  ) {
    return;
  }
  const { left, top, width, height } = from.getBoundingClientRect();
  const burst = document.createElement('div');
  burst.setAttribute('aria-hidden', 'true');
  Object.assign(burst.style, {
    position: 'fixed',
    left: `${left + width / 2}px`,
    top: `${top + height / 2}px`,
    zIndex: '1000',
    pointerEvents: 'none',
  });
  document.body.append(burst);

  const pieces = Array.from({ length: PIECES }, (_, index) => {
    const piece = document.createElement('span');
    Object.assign(piece.style, {
      position: 'absolute',
      width: '8px',
      height: '8px',
      borderRadius: index % 2 ? '50%' : '2px',
      background: COLORS[index % COLORS.length],
    });
    burst.append(piece);
    const angle = (index / PIECES) * 2 * Math.PI + Math.random() * 0.4;
    const distance = 36 + Math.random() * 36;
    const x = Math.cos(angle) * distance;
    // Falls a little, like paper.
    const y = Math.sin(angle) * distance + 16;
    return piece.animate(
      [
        { transform: 'translate(-50%, -50%)', opacity: 1 },
        {
          transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) rotate(${Math.random() * 360}deg) scale(0.6)`,
          opacity: 0,
        },
      ],
      { duration: DURATION_MS, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' },
    ).finished;
  });
  void Promise.allSettled(pieces).then(() => burst.remove());
};
