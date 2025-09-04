import { getInstalledVersion, setInstalledVersion, getCurrentVersion } from './versionManager';

// Initialize installed version if missing; called on app startup
export const ensureInstalledVersion = async () => {
	try {
		const installed = getInstalledVersion();
		if (!installed) {
			const current = await getCurrentVersion();
			setInstalledVersion({ version: current, installDate: new Date().toISOString() });
		}
	} catch (e) {
		// Non-fatal
		console.warn('Version init skipped:', e);
	}
};
