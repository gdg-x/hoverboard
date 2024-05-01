import { jest } from '@jest/globals';
import '@testing-library/jest-dom/jest-globals';

jest.mock('firebase/messaging');
jest.mock('../src/firebase');
