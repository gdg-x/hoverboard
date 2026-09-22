import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';
import { ReadableStream } from 'node:stream/web';
import { TextDecoder, TextEncoder } from 'node:util';

jest.mock('firebase/messaging');
jest.mock('../src/firebase');

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
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
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
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

class MockPointerEvent {}

Object.defineProperty(window, 'PointerEvent', {
  writable: true,
  value: MockPointerEvent,
});

Object.defineProperty(Element.prototype, 'animate', {
  writable: true,
  value: jest.fn().mockReturnValue({
    cancel: jest.fn(),
    finish: jest.fn(),
    pause: jest.fn(),
    play: jest.fn(),
    reverse: jest.fn(),
    updatePlaybackRate: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  }),
});

// JSDOM does not yet implement the ElementInternals APIs used by Material text fields.
const attachInternals = jest.fn(() => ({
  form: null,
  labels: [],
  states: new Set<string>(),
  validity: { valid: true },
  validationMessage: '',
  willValidate: true,
  checkValidity: jest.fn(() => true),
  reportValidity: jest.fn(() => true),
  setFormValue: jest.fn(),
  setValidity: jest.fn(),
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
  value: jest.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  }),
});

Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  writable: true,
  value: jest.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  }),
});
