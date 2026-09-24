import { afterEach, describe, expect, it, vi } from 'vitest';
import { confirm } from './prompt.js';

const { createInterfaceMock, questionMock, closeMock } = vi.hoisted(() => {
  const questionMock = vi.fn();
  const closeMock = vi.fn();
  const createInterfaceMock = vi.fn(() => ({ question: questionMock, close: closeMock }));
  return { createInterfaceMock, questionMock, closeMock };
});

vi.mock('readline/promises', () => ({ createInterface: createInterfaceMock }));

afterEach(() => {
  vi.clearAllMocks();
});

describe('confirm', () => {
  it.each(['y', 'Y', 'yes', 'YES'])('treats "%s" as confirmed', async (answer) => {
    questionMock.mockResolvedValue(answer);

    await expect(confirm('Continue?')).resolves.toBe(true);
    expect(closeMock).toHaveBeenCalled();
  });

  it.each(['n', 'no', '', 'maybe'])('treats "%s" as declined', async (answer) => {
    questionMock.mockResolvedValue(answer);

    await expect(confirm('Continue?')).resolves.toBe(false);
  });

  it('closes the readline interface even if the question rejects', async () => {
    questionMock.mockRejectedValue(new Error('boom'));

    await expect(confirm('Continue?')).rejects.toThrow('boom');
    expect(closeMock).toHaveBeenCalled();
  });
});
