import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { CSSResult, LitElement } from 'lit';
import { describe, expect, it } from 'vitest';
import { segmented } from '../../styles/segmented';
import { THEMES, themeDeclarations } from '../../themes/index';
import { HbButton } from './hb-button';
import { HbChip } from './hb-chip';
import { HbIconButton } from './hb-icon-button';
import { HbMenu } from './hb-menu';
import { HbSwitch } from './hb-switch';
import { HbTextField } from './hb-text-field';

// WCAG 2.5.8, target size (minimum).
const MIN_TARGET = 24;

const baseCss = readFileSync(join(import.meta.dirname, '../../styles/base.css'), 'utf8');
const targetMin = /--hb-target-min: ([^;]+);/.exec(baseCss)?.[1];

const cssText = (element: typeof LitElement) =>
  element.elementStyles.map((style) => (style as CSSResult).cssText).join('\n');

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const declaration = (css: string, selector: string, property: string) => {
  const block = new RegExp(`(?:^|\\s)${escape(selector)} \\{([^}]*)\\}`).exec(css)?.[1];
  return block && new RegExp(`(?:^|[\\s;])${escape(property)}: ([^;]+);`).exec(block)?.[1];
};

const pixels = (value: string | undefined) => {
  const resolved = value === 'var(--hb-target-min)' ? targetMin : value;
  const match = /^(\d+(?:\.\d+)?)px$/.exec(resolved ?? '');
  return match ? Number(match[1]) : undefined;
};

describe('touch targets', () => {
  it('are a fixed size, which density does not shrink', () => {
    expect(pixels(targetMin)).toBeGreaterThanOrEqual(MIN_TARGET);
  });

  it.each(Object.keys(THEMES))('keep their size in the %s theme', (name) => {
    expect(themeDeclarations(THEMES[name as keyof typeof THEMES])).not.toContain('--hb-target-min');
  });

  it.each([
    ['hb-button', cssText(HbButton), '.button', 'min-block-size'],
    ['hb-icon-button', cssText(HbIconButton), ':host', '--hb-icon-button-size'],
    ['hb-icon-button, large', cssText(HbIconButton), ":host([size='l'])", '--hb-icon-button-size'],
    ['hb-chip', cssText(HbChip), '.chip', 'min-block-size'],
    ['hb-switch', cssText(HbSwitch), 'label', 'min-block-size'],
    ['hb-text-field', cssText(HbTextField), '.control', 'min-block-size'],
    ['hb-menu items', cssText(HbMenu), "::slotted([role='menuitem'])", 'min-block-size'],
    ['segmented options, height', segmented.cssText, 'label', 'min-block-size'],
    ['segmented options, width', segmented.cssText, 'label', 'min-inline-size'],
  ])('are at least 24px in %s', (_, css, selector, property) => {
    expect(pixels(declaration(css, selector, property))).toBeGreaterThanOrEqual(MIN_TARGET);
  });
});
