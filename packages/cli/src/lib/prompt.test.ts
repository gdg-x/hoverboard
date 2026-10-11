import { afterEach, describe, expect, it, vi } from 'vitest';
import { UsageError } from './command.js';
import { ask, confirm, confirmChange } from './prompt.js';

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

describe('confirmChange', () => {
  const isTTY = process.stdin.isTTY;
  afterEach(() => {
    process.stdin.isTTY = isTTY;
  });

  it('asks on a terminal', async () => {
    process.stdin.isTTY = true;
    questionMock.mockResolvedValue('y');

    await expect(confirmChange('Write it?')).resolves.toBe(true);
    expect(questionMock).toHaveBeenCalledWith('Write it? [y/N] ');
  });

  it('goes ahead without asking with yes', async () => {
    process.stdin.isTTY = false;

    await expect(confirmChange('Write it?', true)).resolves.toBe(true);
    expect(questionMock).not.toHaveBeenCalled();
  });

  it('is a usage error that names --yes without a terminal to ask in', async () => {
    process.stdin.isTTY = false;

    await expect(confirmChange('\nWrite it?')).rejects.toThrow(
      new UsageError('Write it? Run again with --yes to do it without asking.'),
    );
    expect(questionMock).not.toHaveBeenCalled();
  });
});

describe('ask', () => {
  it('returns the trimmed answer', async () => {
    questionMock.mockResolvedValue('  Fest  ');

    await expect(ask('Event name:', 'Old')).resolves.toBe('Fest');
    expect(questionMock).toHaveBeenCalledWith('Event name: (Old) ');
    expect(closeMock).toHaveBeenCalled();
  });

  it('returns the default for an empty answer', async () => {
    questionMock.mockResolvedValue('');

    await expect(ask('Event name:', 'Old')).resolves.toBe('Old');
  });

  it('shows no default when there is none', async () => {
    questionMock.mockResolvedValue('Fest');

    await ask('Event name:');

    expect(questionMock).toHaveBeenCalledWith('Event name: ');
  });
});
