
/**
 * Notion URL Validator
 * 
 * Validates and extracts database IDs from Notion URLs
 */

export class NotionUrlValidator {
  private static readonly URL_PATTERNS = [
    /notion\.so\/([a-f0-9]{32})\?/,
    /notion\.so\/.*-([a-f0-9]{32})$/,
    /notion\.so\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
    /([a-f0-9]{32})/
  ];

  static extractDatabaseId(url: string): string | null {
    try {
      for (const pattern of this.URL_PATTERNS) {
        const match = url.match(pattern);
        if (match) {
          let databaseId = match[1];
          databaseId = databaseId.replace(/-/g, '');
          if (databaseId.length === 32) {
            return databaseId;
          }
        }
      }
      return null;
    } catch (error) {
      console.error('Error extracting database ID:', error);
      return null;
    }
  }

  static isValidNotionUrl(url: string): boolean {
    return url.includes('notion.so') && this.extractDatabaseId(url) !== null;
  }
}
