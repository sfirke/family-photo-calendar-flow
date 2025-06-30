
import React from 'react';
import { Shield } from 'lucide-react';
import { useSecurity } from '@/contexts/SecurityContext';
import SecurityUnlockBanner from '@/components/security/SecurityUnlockBanner';
import SecurityStatusDisplay from './security/SecurityStatusDisplay';
import SecurityEnableForm from './security/SecurityEnableForm';
import SecurityUnlockForm from './security/SecurityUnlockForm';
import SecurityDisableSection from './security/SecurityDisableSection';

const SecurityTab = () => {
  const { 
    isSecurityEnabled, 
    hasLockedData, 
    enableSecurity, 
    disableSecurity, 
    getSecurityStatus 
  } = useSecurity();

  const hasSecuritySalt = localStorage.getItem('security_salt') !== null;
  const needsUnlock = hasSecuritySalt && !isSecurityEnabled;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Shield className="h-5 w-5" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Security Settings</h3>
      </div>
      
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {needsUnlock 
          ? "Enter your password to unlock encrypted data"
          : "Configure client-side encryption for your sensitive data"
        }
      </p>

      <SecurityUnlockBanner />

      <SecurityStatusDisplay
        isSecurityEnabled={isSecurityEnabled}
        hasLockedData={hasLockedData}
        getSecurityStatus={getSecurityStatus}
      />

      {needsUnlock ? (
        <SecurityUnlockForm onUnlock={enableSecurity} />
      ) : isSecurityEnabled ? (
        <SecurityDisableSection onDisableSecurity={disableSecurity} />
      ) : (
        <SecurityEnableForm onEnableSecurity={enableSecurity} />
      )}
    </div>
  );
};

export default SecurityTab;
