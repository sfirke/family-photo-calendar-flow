
import { setupServer } from 'msw/node';
import { weatherHandlers } from './weatherHandlers';
import { photoHandlers } from './photoHandlers';

export const server = setupServer(...weatherHandlers, ...photoHandlers);
