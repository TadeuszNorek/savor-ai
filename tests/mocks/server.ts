import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * MSW Server for Node environment (tests)
 * This sets up a mock server that intercepts HTTP requests during tests
 */
export const server = setupServer(...handlers);
