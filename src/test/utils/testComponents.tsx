import React from 'react';
import { AllTheProviders, TestErrorBoundary } from './testProviders';

// Re-export the enhanced providers for backward compatibility
export { AllTheProviders, TestErrorBoundary };

// Keep the original export for any existing imports
export const OriginalAllTheProviders = AllTheProviders;
