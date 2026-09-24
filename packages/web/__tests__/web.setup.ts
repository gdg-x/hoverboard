import '@testing-library/jest-dom/vitest';
import { ReadableStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';
import { vi } from 'vitest';

vi.mock('firebase/messaging');
vi.mock('../src/firebase');

// JSDOM does not provide these Node/Web globals used by firebase/auth's
// dependency chain (undici).
Object.defineProperty(globalThis, 'TextEncoder', {
  writable: true,
  value: TextEncoder,
});

Object.defineProperty(globalThis, 'TextDecoder', {
  writable: true,
  value: TextDecoder,
});

Object.defineProperty(globalThis, 'ReadableStream', {
  writable: true,
  value: ReadableStream,
});

// JSDOM does not provide setImmediate/clearImmediate, used by @grpc/grpc-js
// (a transitive dependency of firebase/firestore's realtime listeners).
Object.defineProperty(globalThis, 'setImmediate', {
  writable: true,
  value: (fn: (...args: unknown[]) => void, ...args: unknown[]) => setTimeout(fn, 0, ...args),
});

Object.defineProperty(globalThis, 'clearImmediate', {
  writable: true,
  value: clearTimeout,
});

// JSDOM does not implement IntersectionObserver, used by @justinribeiro/lite-youtube
// (rendered inside video-dialog).
class MockIntersectionObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// @material/web uses window.matchMedia which is not available in JSDOM.
// https://jestjs.io/docs/manual-mocks#mocking-methods-which-are-not-implemented-in-jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

class MockPointerEvent {}

Object.defineProperty(window, 'PointerEvent', {
  writable: true,
  value: MockPointerEvent,
});

Object.defineProperty(Element.prototype, 'animate', {
  writable: true,
  value: vi.fn().mockReturnValue({
    cancel: vi.fn(),
    finish: vi.fn(),
    pause: vi.fn(),
    play: vi.fn(),
    reverse: vi.fn(),
    updatePlaybackRate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// JSDOM does not yet implement the ElementInternals APIs used by Material text fields.
const attachInternals = vi.fn(() => ({
  form: null,
  labels: [],
  states: new Set<string>(),
  validity: { valid: true },
  validationMessage: '',
  willValidate: true,
  checkValidity: vi.fn(() => true),
  reportValidity: vi.fn(() => true),
  setFormValue: vi.fn(),
  setValidity: vi.fn(),
}));

Object.defineProperty(Element.prototype, 'attachInternals', {
  writable: true,
  value: attachInternals,
});

Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
  writable: true,
  value: attachInternals,
});

// JSDOM does not implement the <dialog> element's showModal/close, used by
// hoverboard-dialog.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  writable: true,
  value: vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  }),
});

Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  writable: true,
  value: vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  }),
});
