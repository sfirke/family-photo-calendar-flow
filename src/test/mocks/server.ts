
import { setupServer } from 'msw/node';
import { weatherHandlers } from './weatherHandlers';
import { photoHandlers } from './photoHandlers';
import { versionHandlers } from './versionHandlers';

export const server = setupServer(...weatherHandlers, ...photoHandlers, ...versionHandlers);
