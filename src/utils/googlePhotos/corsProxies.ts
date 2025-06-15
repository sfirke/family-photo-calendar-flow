
// CORS proxy configuration and utilities

export interface ProxyConfig {
  url: string;
  requiresJsonResponse: boolean;
  responseProperty?: string;
}

export const CORS_PROXIES: ProxyConfig[] = [
  { url: 'https://api.codetabs.com/v1/proxy?quest=', requiresJsonResponse: false },
  { url: 'https://cors-anywhere.herokuapp.com/', requiresJsonResponse: false },
  { url: 'https://api.allorigins.win/get?url=', requiresJsonResponse: true, responseProperty: 'contents' },
  { url: 'https://thingproxy.freeboard.io/fetch/', requiresJsonResponse: false }
];

export const buildProxyUrl = (proxyConfig: ProxyConfig, targetUrl: string): string => {
  if (proxyConfig.url.includes('allorigins.win') || proxyConfig.url.includes('codetabs.com')) {
    return proxyConfig.url + encodeURIComponent(targetUrl);
  }
  return proxyConfig.url + targetUrl;
};

export const getProxyHeaders = (proxyConfig: ProxyConfig): Record<string, string> => {
  if (proxyConfig.requiresJsonResponse) {
    return { 'Accept': 'application/json' };
  }
  return { 'Accept': 'application/json, text/html, */*' };
};

export const extractResponseContent = async (response: Response, proxyConfig: ProxyConfig): Promise<string> => {
  if (proxyConfig.requiresJsonResponse && proxyConfig.responseProperty) {
    const data = await response.json();
    return data[proxyConfig.responseProperty];
  }
  return await response.text();
};
