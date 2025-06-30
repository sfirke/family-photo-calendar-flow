
export interface UpdateInfo {
  version: string;
  publishedAt: string;
  htmlUrl: string;
  body: string;
  assets?: UpdateAsset[];
}

export interface UpdateAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

export interface ReleaseNote {
  version: string;
  date: string;
  changes: string[];
  breaking?: boolean;
}

export interface VersionInfo {
  version: string;
  buildDate?: string;
  gitHash?: string;
  buildNumber?: number;
  environment?: string;
}

export interface UpdateProgress {
  stage: 'checking' | 'downloading' | 'applying' | 'complete' | 'error';
  message: string;
  progress?: number;
}

export interface UpstreamVersionInfo {
  version: string;
  publishedAt: string;
  htmlUrl: string;
  body?: string;  // Make body optional to match the actual upstream response
  assets?: UpdateAsset[];
}

// Helper function to convert UpstreamVersionInfo to UpdateInfo
export const convertToUpdateInfo = (upstream: UpstreamVersionInfo): UpdateInfo => ({
  version: upstream.version,
  publishedAt: upstream.publishedAt,
  htmlUrl: upstream.htmlUrl,
  body: upstream.body || '',  // Provide default empty string if body is missing
  assets: upstream.assets
});
