
/**
 * Notion API Configuration
 * 
 * Centralized configuration for Notion API integration
 */

export const NOTION_CONFIG = {
  API_BASE: 'https://api.notion.com/v1',
  VERSION: '2022-06-28',
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  PAGE_SIZE: 100,
  MAX_PAGES: 1000,
  TIMEOUT: 30000
} as const;

export const NOTION_ERRORS = {
  UNAUTHORIZED: 'Invalid or expired integration token',
  FORBIDDEN: 'Integration does not have access to this resource',
  NOT_FOUND: 'Resource not found or not shared with integration',
  RATE_LIMITED: 'Rate limit exceeded, please try again later',
  NETWORK_ERROR: 'Unable to connect to Notion API',
  INVALID_REQUEST: 'Invalid request format or parameters'
} as const;
