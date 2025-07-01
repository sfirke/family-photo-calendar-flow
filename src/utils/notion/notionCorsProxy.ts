
import { CORS_PROXIES, buildProxyUrl, getProxyHeaders, extractResponseContent } from '@/utils/googlePhotos/corsProxies';

interface NotionProxyConfig {
  baseUrl: string;
  headers: Record<string, string>;
}

interface NotionProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  proxyUsed?: string;
}

export class NotionCorsProxy {
  private normalizeHeaders(headers?: HeadersInit): Record<string, string> {
    if (!headers) return {};
    
    if (headers.constructor === Object) {
      return headers as Record<string, string>;
    }
    
    if (headers instanceof Headers) {
      const normalized: Record<string, string> = {};
      headers.forEach((value, key) => {
        normalized[key] = value;
      });
      return normalized;
    }
    
    if (Array.isArray(headers)) {
      const normalized: Record<string, string> = {};
      headers.forEach(([key, value]) => {
        normalized[key] = value;
      });
      return normalized;
    }
    
    return {};
  }

  private async makeProxiedRequest(
    endpoint: string, 
    token: string, 
    options: RequestInit = {}
  ): Promise<NotionProxyResponse> {
    const fullUrl = `https://api.notion.com/v1${endpoint}`;
    
    // Prepare headers for Notion API
    const notionHeaders = {
      'Authorization': `Bearer ${token}`,
      'Notion-Version': '2022-02-22',
      'Content-Type': 'application/json'
    };

    // Normalize incoming headers
    const normalizedOptionHeaders = this.normalizeHeaders(options.headers);
    const allHeaders = { ...notionHeaders, ...normalizedOptionHeaders };

    // Try direct request first
    try {
      console.log('🔄 Attempting direct Notion API request...');
      const response = await fetch(fullUrl, {
        ...options,
        headers: allHeaders,
        mode: 'cors'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Direct Notion API request successful');
        return { success: true, data };
      }
    } catch (error) {
      console.log('❌ Direct request failed, trying proxies...');
    }

    // Try each proxy
    for (let i = 0; i < CORS_PROXIES.length; i++) {
      const proxy = CORS_PROXIES[i];
      
      try {
        console.log(`🔄 Trying proxy ${i + 1}/${CORS_PROXIES.length}: ${proxy.url}`);
        
        const proxyUrl = buildProxyUrl(proxy, fullUrl);
        const proxyHeaders = getProxyHeaders(proxy);
        
        // For proxies that support custom headers, try to include auth
        let requestHeaders: Record<string, string> = { ...proxyHeaders };
        
        // Some proxies allow headers to be passed through query params or special headers
        if (proxy.url.includes('allorigins.win')) {
          // allorigins.win doesn't support custom headers, skip for authenticated requests
          console.log('⏭️ Skipping allorigins.win (no auth header support)');
          continue;
        }
        
        if (proxy.url.includes('codetabs.com')) {
          // codetabs may support headers
          requestHeaders = { ...requestHeaders, ...allHeaders };
        }
        
        if (proxy.url.includes('cors-anywhere') || proxy.url.includes('thingproxy')) {
          // These typically support header forwarding
          requestHeaders = { ...requestHeaders, ...allHeaders };
        }

        const response = await fetch(proxyUrl, {
          ...options,
          headers: requestHeaders,
          method: options.method || 'GET'
        });

        if (response.ok) {
          const responseText = await extractResponseContent(response, proxy);
          
          try {
            const data = JSON.parse(responseText);
            console.log(`✅ Proxy request successful via ${proxy.url}`);
            return { success: true, data, proxyUsed: proxy.url };
          } catch (parseError) {
            console.warn(`Failed to parse JSON from proxy ${proxy.url}:`, parseError);
            continue;
          }
        } else {
          console.warn(`Proxy ${proxy.url} returned status:`, response.status);
        }
      } catch (error) {
        console.warn(`Proxy ${proxy.url} failed:`, error);
        continue;
      }
    }

    return { 
      success: false, 
      error: 'All proxy attempts failed. Notion API may be unreachable or token may be invalid.' 
    };
  }

  async validateToken(token: string): Promise<NotionProxyResponse> {
    return this.makeProxiedRequest('/users/me', token);
  }

  async getPage(pageId: string, token: string): Promise<NotionProxyResponse> {
    return this.makeProxiedRequest(`/pages/${pageId}`, token);
  }

  async getDatabase(databaseId: string, token: string): Promise<NotionProxyResponse> {
    return this.makeProxiedRequest(`/databases/${databaseId}`, token);
  }

  async queryDatabase(databaseId: string, token: string, filter?: any): Promise<NotionProxyResponse> {
    return this.makeProxiedRequest(`/databases/${databaseId}/query`, token, {
      method: 'POST',
      body: JSON.stringify({
        filter,
        sorts: [
          {
            property: 'Date',
            direction: 'ascending'
          }
        ]
      })
    });
  }
}

export const notionCorsProxy = new NotionCorsProxy();
