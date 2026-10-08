import { afterEach, describe, expect, it, vi } from 'vitest';
import { firebaseProjects } from './firebase-projects.js';

const { captureCommandMock } = vi.hoisted(() => ({ captureCommandMock: vi.fn() }));

vi.mock('../../lib/spawn.js', () => ({ captureCommand: captureCommandMock }));
vi.mock('../../lib/firebase-cli.js', () => ({ resolveFirebaseBin: () => '/bin/firebase' }));

const succeed = (result: unknown) => ({
  status: 0,
  stdout: JSON.stringify({ status: 'success', result }),
  stderr: '',
});

afterEach(() => {
  vi.clearAllMocks();
});

describe('firebaseProjects', () => {
  it('knows whether an account is signed in', () => {
    captureCommandMock.mockReturnValueOnce(succeed([{ user: { email: 'a@example.com' } }]));
    captureCommandMock.mockReturnValueOnce(succeed([]));
    const projects = firebaseProjects('/repo');

    expect(projects.signedIn()).toBe(true);
    expect(projects.signedIn()).toBe(false);
    expect(captureCommandMock).toHaveBeenCalledWith(
      '/bin/firebase',
      ['login:list', '--json'],
      '/repo',
    );
  });

  it('lists the projects of the signed-in account', () => {
    captureCommandMock.mockReturnValue(succeed([{ projectId: 'fest', displayName: 'Fest' }]));

    expect(firebaseProjects('/repo').list()).toEqual([{ projectId: 'fest', displayName: 'Fest' }]);
    expect(captureCommandMock).toHaveBeenCalledWith(
      '/bin/firebase',
      ['projects:list', '--json'],
      '/repo',
    );
  });

  it('creates a project and a web app', () => {
    captureCommandMock.mockReturnValue(succeed({}));
    const projects = firebaseProjects('/repo');

    projects.create('fest-2027', 'Fest');
    projects.createWebApp('fest-2027', 'Hoverboard');

    expect(captureCommandMock.mock.calls.map(([, args]) => args)).toEqual([
      ['projects:create', 'fest-2027', '--display-name', 'Fest', '--json'],
      ['apps:create', 'WEB', 'Hoverboard', '--project', 'fest-2027', '--json'],
    ]);
  });

  it('names the web apps by display name, or ID without one', () => {
    captureCommandMock.mockReturnValue(
      succeed([{ appId: '1:web:a', displayName: 'Site' }, { appId: '1:web:b' }]),
    );

    expect(firebaseProjects('/repo').webApps('fest')).toEqual(['Site', '1:web:b']);
  });

  it("throws the CLI's error", () => {
    captureCommandMock.mockReturnValue({
      status: 1,
      stdout: JSON.stringify({ status: 'error', error: 'Project ID is taken.' }),
      stderr: '',
    });

    expect(() => firebaseProjects('/repo').create('taken', 'Taken')).toThrow(
      'Project ID is taken.',
    );
  });

  it('throws stderr when the output is not JSON', () => {
    captureCommandMock.mockReturnValue({ status: 1, stdout: '', stderr: 'Not logged in.\n' });

    expect(() => firebaseProjects('/repo').list()).toThrow('Not logged in.');
  });
});
