
import { useState, useCallback } from 'react';
import { icalValidationUtils } from '@/utils/ical/icalValidationUtils';

export const useICalValidation = () => {
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'valid' | 'invalid'>('idle');
  const [validationError, setValidationError] = useState<string | null>(null);

  const validateUrl = useCallback(async (url: string): Promise<boolean> => {
    setValidationStatus('validating');
    setValidationError(null);
    
    try {
      const isValid = await icalValidationUtils.validateICalUrl(url);
      setValidationStatus(isValid ? 'valid' : 'invalid');
      
      if (!isValid) {
        setValidationError('Invalid iCal URL or unreachable calendar');
      }
      
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationStatus('invalid');
      setValidationError(errorMessage);
      return false;
    }
  }, []);

  const validateCalendarData = useCallback((data: string): boolean => {
    try {
      const isValid = icalValidationUtils.validateICalData(data);
      setValidationStatus(isValid ? 'valid' : 'invalid');
      
      if (!isValid) {
        setValidationError('Invalid iCal data format');
      }
      
      return isValid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Data validation failed';
      setValidationStatus('invalid');
      setValidationError(errorMessage);
      return false;
    }
  }, []);

  const resetValidation = useCallback(() => {
    setValidationStatus('idle');
    setValidationError(null);
  }, []);

  return {
    validationStatus,
    validationError,
    validateUrl,
    validateCalendarData,
    resetValidation
  };
};
