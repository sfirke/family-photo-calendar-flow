export interface ChangeEntry {
  id: string;
  timestamp: string;
  type: 'feature' | 'bugfix' | 'refactor' | 'ui' | 'performance' | 'security';
  title: string;
  description: string;
  files: string[];
  userRequest?: string;
  aiResponse?: string;
}

const CHANGES_KEY = 'ai_changes';

export const trackChange = (change: Omit<ChangeEntry, 'id' | 'timestamp'>) => {
  const changes = getStoredChanges();
  const newChange: ChangeEntry = {
    ...change,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString()
  };
  
  changes.unshift(newChange);
  
  // Keep only the last 50 changes to prevent storage bloat
  const trimmedChanges = changes.slice(0, 50);
  
  localStorage.setItem(CHANGES_KEY, JSON.stringify(trimmedChanges));
  
  return newChange;
};

export const getStoredChanges = (): ChangeEntry[] => {
  try {
    const stored = localStorage.getItem(CHANGES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error parsing stored changes:', error);
    return [];
  }
};

export const getChangesSince = (version: string): ChangeEntry[] => {
  const changes = getStoredChanges();
  const versionDate = getVersionDate(version);
  
  if (!versionDate) return changes;
  
  return changes.filter(change => 
    new Date(change.timestamp) > versionDate
  );
};

export const clearChanges = () => {
  localStorage.removeItem(CHANGES_KEY);
};

// Helper to get version release date (mock implementation)
const getVersionDate = (version: string): Date | null => {
  // In a real implementation, this would fetch from a version history API
  // For now, we'll use a simple mapping
  const versionDates: Record<string, string> = {
    '1.0.0': '2024-01-01T00:00:00Z',
    '1.0.1': '2024-01-15T00:00:00Z',
    '1.1.0': '2024-02-01T00:00:00Z'
  };
  
  const dateString = versionDates[version];
  return dateString ? new Date(dateString) : null;
};

// Auto-track AI changes (this would be called when AI makes changes)
export const autoTrackAIChange = (
  type: ChangeEntry['type'],
  title: string,
  description: string,
  files: string[],
  userRequest?: string
) => {
  return trackChange({
    type,
    title,
    description,
    files,
    userRequest,
    aiResponse: 'AI-generated change'
  });
};
