/**
 * Environment utilities
 *
 * Centralizes detection of test environment behavior toggles so we avoid
 * sprinkling raw `process.env.NODE_ENV === 'test'` checks throughout code.
 *
 * By default, returns true when running under NODE_ENV === 'test'.
 * To force full runtime behavior inside tests (e.g. integration / e2e style
 * tests that want real async initialization), set the environment variable
 * FULL_INTEGRATION_TEST=1 when invoking Vitest.
 */
export const isTestEnv = (): boolean => {
  if (typeof process === "undefined") return false;
  return process.env.NODE_ENV === "test" && process.env.FULL_INTEGRATION_TEST !== "1";
};

/** Convenience helper for integration test mode (opposite of isTestEnv). */
export const isFullIntegrationTest = (): boolean => {
  if (typeof process === "undefined") return false;
  return process.env.NODE_ENV === "test" && process.env.FULL_INTEGRATION_TEST === "1";
};
