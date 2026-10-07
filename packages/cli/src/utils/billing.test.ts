import { afterEach, describe, expect, it, vi } from 'vitest';
import { checkBilling } from './billing.js';

const { isBillingEnabledMock } = vi.hoisted(() => ({ isBillingEnabledMock: vi.fn() }));

vi.mock('../lib/billing.js', () => ({ isBillingEnabled: isBillingEnabledMock }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('checkBilling', () => {
  it('skips with a warning when no project is selected', async () => {
    const result = await checkBilling('/repo', undefined);

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(isBillingEnabledMock).not.toHaveBeenCalled();
  });

  it('passes when billing is enabled', async () => {
    isBillingEnabledMock.mockResolvedValue(true);

    const result = await checkBilling('/repo', 'demo-project');

    expect(result.ok).toBe(true);
    expect(result.warning).toBeUndefined();
    expect(isBillingEnabledMock).toHaveBeenCalledWith('/repo', 'demo-project');
  });

  it('warns with an upgrade link when billing is disabled', async () => {
    isBillingEnabledMock.mockResolvedValue(false);

    const result = await checkBilling('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain(
      'https://console.firebase.google.com/project/demo-project/usage/details',
    );
  });

  it('warns when billing could not be checked', async () => {
    isBillingEnabledMock.mockRejectedValue(new Error('Not logged in to Firebase.'));

    const result = await checkBilling('/repo', 'demo-project');

    expect(result).toMatchObject({ ok: true, warning: true });
    expect(result.message).toContain('Not logged in to Firebase.');
  });
});
