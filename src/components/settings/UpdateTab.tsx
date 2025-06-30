
import React, { useEffect } from 'react';
import { useUpdateManager } from '@/hooks/useUpdateManager';
import GitHubRepositorySettings from './update/GitHubRepositorySettings';
import VersionInfoCard from './update/VersionInfoCard';
import UpdateStatusCard from './update/UpdateStatusCard';
import UpdateProgressDisplay from './update/UpdateProgressDisplay';
import ReleaseNotesDisplay from './update/ReleaseNotesDisplay';
import UpdateInfoSection from './update/UpdateInfoSection';

const UpdateTab = () => {
  const {
    isChecking,
    isUpdating,
    updateAvailable,
    updateInfo,
    currentVersion,
    lastCheckTime,
    updateProgress,
    loadCurrentInfo,
    checkForUpdatesManually,
    installUpdate,
    openReleaseNotes
  } = useUpdateManager();

  useEffect(() => {
    loadCurrentInfo();
  }, [loadCurrentInfo]);

  return (
    <div className="space-y-4">
      {/* GitHub Repository Configuration */}
      <GitHubRepositorySettings />

      {/* Current Version Card */}
      <VersionInfoCard 
        currentVersion={currentVersion}
        lastCheckTime={lastCheckTime}
      />

      {/* Update Status Card */}
      <UpdateStatusCard
        updateAvailable={updateAvailable}
        updateInfo={updateInfo}
        isChecking={isChecking}
        isUpdating={isUpdating}
        onCheckForUpdates={checkForUpdatesManually}
        onInstallUpdate={installUpdate}
        onOpenReleaseNotes={openReleaseNotes}
      />

      {/* Update Progress */}
      <UpdateProgressDisplay 
        updateProgress={updateProgress}
        isUpdating={isUpdating}
      />

      {/* Release Notes */}
      <ReleaseNotesDisplay
        updateAvailable={updateAvailable}
        updateInfo={updateInfo}
      />

      {/* Information */}
      <UpdateInfoSection />
    </div>
  );
};

export default UpdateTab;
