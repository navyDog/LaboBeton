import '@testing-library/jest-dom';
import { jest } from '@jest/globals';

// Mock global de fetch si nécessaire pour tous les tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    ok: true,
    status: 200,
    headers: new Headers(),
  } as Response)
);