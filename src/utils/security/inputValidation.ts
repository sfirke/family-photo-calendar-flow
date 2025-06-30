
// Enhanced input validation and sanitization
export class InputValidator {
  // URL validation with enhanced security checks
  static validateUrl(url: string): { isValid: boolean; error?: string } {
    if (!url || typeof url !== 'string') {
      return { isValid: false, error: 'URL is required' };
    }

    const trimmedUrl = url.trim();
    
    if (trimmedUrl.length === 0) {
      return { isValid: false, error: 'URL cannot be empty' };
    }

    if (trimmedUrl.length > 2048) {
      return { isValid: false, error: 'URL is too long' };
    }

    // Check for dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    const lowerUrl = trimmedUrl.toLowerCase();
    
    if (dangerousProtocols.some(protocol => lowerUrl.startsWith(protocol))) {
      return { isValid: false, error: 'Unsafe URL protocol detected' };
    }

    // Must be HTTP or HTTPS
    if (!lowerUrl.startsWith('http://') && !lowerUrl.startsWith('https://')) {
      return { isValid: false, error: 'URL must use HTTP or HTTPS protocol' };
    }

    try {
      const urlObj = new URL(trimmedUrl);
      
      // Check for suspicious characters
      if (urlObj.hostname.includes('..') || urlObj.pathname.includes('..')) {
        return { isValid: false, error: 'URL contains suspicious path traversal' };
      }

      // Basic domain validation
      if (urlObj.hostname.length === 0 || urlObj.hostname.length > 253) {
        return { isValid: false, error: 'Invalid domain name' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  }

  // Sanitize text input
  static sanitizeText(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      .replace(/[<>]/g, '') // Remove HTML brackets
      .replace(/javascript:/gi, '') // Remove javascript protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }

  // Validate API key format with progressive validation
  static validateApiKey(apiKey: string): { isValid: boolean; error?: string } {
    if (!apiKey || typeof apiKey !== 'string') {
      return { isValid: false, error: 'API key is required' };
    }

    const trimmed = apiKey.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'API key cannot be empty' };
    }

    // Relaxed validation - only check for dangerous content, not length
    if (trimmed.includes('<') || trimmed.includes('>') || trimmed.includes('script')) {
      return { isValid: false, error: 'API key contains invalid characters' };
    }

    if (trimmed.length > 256) {
      return { isValid: false, error: 'API key is too long' };
    }

    // Only warn about length if the key appears complete (no spaces, reasonable length)
    if (trimmed.length < 8 && !trimmed.includes(' ') && trimmed.length > 3) {
      return { isValid: false, error: 'API key appears to be too short' };
    }

    return { isValid: true };
  }

  // Validate zip code format with strict validation for tests
  static validateZipCode(zipCode: string, allowPartial: boolean = false): { isValid: boolean; error?: string } {
    if (!zipCode || typeof zipCode !== 'string') {
      return { isValid: false, error: 'Zip code is required' };
    }

    const trimmed = zipCode.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Zip code cannot be empty' };
    }

    // US ZIP code format (5 digits or 5+4) - allow partial input during typing
    const zipRegex = /^\d{5}(-\d{4})?$/;
    const partialZipRegex = /^\d{1,5}(-\d{0,4})?$/;
    
    // For strict validation (like in tests), require complete format
    if (!allowPartial && trimmed.length >= 3) {
      if (!zipRegex.test(trimmed)) {
        return { isValid: false, error: 'Invalid zip code format (use 12345 or 12345-6789)' };
      }
    }
    
    // For partial input, use relaxed regex
    if (allowPartial && !partialZipRegex.test(trimmed)) {
      return { isValid: false, error: 'Zip code should contain only numbers and an optional dash' };
    }
    
    // Reject obviously invalid short codes when not allowing partial
    if (!allowPartial && trimmed.length < 5) {
      return { isValid: false, error: 'Zip code must be at least 5 digits' };
    }

    return { isValid: true };
  }

  // Validate GitHub username
  static validateGithubUsername(username: string): { isValid: boolean; error?: string } {
    if (!username || typeof username !== 'string') {
      return { isValid: false, error: 'GitHub username is required' };
    }

    const trimmed = username.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'GitHub username cannot be empty' };
    }

    if (trimmed.length > 39) {
      return { isValid: false, error: 'GitHub username is too long (max 39 characters)' };
    }

    // GitHub username rules: alphanumeric and hyphens only, cannot start/end with hyphen
    const usernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/;
    
    if (!usernameRegex.test(trimmed)) {
      return { isValid: false, error: 'Invalid GitHub username format (alphanumeric and hyphens only, cannot start/end with hyphen)' };
    }

    return { isValid: true };
  }

  // Validate GitHub repository name
  static validateGithubRepoName(repoName: string): { isValid: boolean; error?: string } {
    if (!repoName || typeof repoName !== 'string') {
      return { isValid: false, error: 'Repository name is required' };
    }

    const trimmed = repoName.trim();
    
    if (trimmed.length === 0) {
      return { isValid: false, error: 'Repository name cannot be empty' };
    }

    if (trimmed.length > 100) {
      return { isValid: false, error: 'Repository name is too long (max 100 characters)' };
    }

    // GitHub repository name rules: alphanumeric, hyphens, underscores, and dots
    // Cannot start with dot or hyphen
    const repoRegex = /^[a-zA-Z0-9_][a-zA-Z0-9._-]*$/;
    
    if (!repoRegex.test(trimmed)) {
      return { isValid: false, error: 'Invalid repository name format (alphanumeric, hyphens, underscores, dots allowed; cannot start with dot or hyphen)' };
    }

    // Reserved names check
    const reservedNames = ['git', 'www', 'ftp', 'mail', 'pop', 'pop3', 'imap', 'smtp', 'admin', 'api'];
    if (reservedNames.includes(trimmed.toLowerCase())) {
      return { isValid: false, error: 'Repository name is reserved' };
    }

    return { isValid: true };
  }
}
