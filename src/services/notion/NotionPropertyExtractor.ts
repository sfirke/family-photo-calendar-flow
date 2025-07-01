
/**
 * Notion Property Extractor
 * 
 * Utilities for extracting values from Notion properties
 */

export class NotionPropertyExtractor {
  static getTitleText(prop: any): string {
    if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
    if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
    if (prop?.select?.name) return prop.select.name;
    return '';
  }

  static getDateValue(prop: any): Date {
    if (prop?.date?.start) {
      return new Date(prop.date.start);
    }
    if (prop?.created_time) {
      return new Date(prop.created_time);
    }
    return new Date();
  }

  static getTextContent(prop: any): string {
    if (prop?.rich_text?.[0]?.plain_text) return prop.rich_text[0].plain_text;
    if (prop?.title?.[0]?.plain_text) return prop.title[0].plain_text;
    return '';
  }

  static extractBestProperty(properties: Record<string, any>, searchTerms: string[]): string {
    for (const [key, value] of Object.entries(properties)) {
      const keyLower = key.toLowerCase();
      for (const term of searchTerms) {
        if (keyLower.includes(term)) {
          const content = this.getTitleText(value) || this.getTextContent(value);
          if (content) return content;
        }
      }
    }
    return '';
  }

  static extractBestDate(properties: Record<string, any>, searchTerms: string[]): Date {
    for (const [key, value] of Object.entries(properties)) {
      const keyLower = key.toLowerCase();
      for (const term of searchTerms) {
        if (keyLower.includes(term)) {
          const date = this.getDateValue(value);
          if (date) return date;
        }
      }
    }
    return new Date();
  }
}
