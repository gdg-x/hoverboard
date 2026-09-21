import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';

jest.mock('firebase/messaging');
jest.mock('../src/firebase');

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
