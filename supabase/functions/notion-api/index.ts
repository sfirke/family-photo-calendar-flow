
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotionRequest {
  action: 'validate' | 'getIntegrationInfo' | 'getPage' | 'getDatabase' | 'queryDatabase' | 'validateAccess';
  token: string;
  pageId?: string;
  databaseId?: string;
  url?: string;
  filter?: any;
}

class NotionAPIHandler {
  private validateTokenFormat(token: string): boolean {
    return token.startsWith('ntn_') && token.length >= 50;
  }

  private classifyNotionError(error: any): string {
    if (error?.code) {
      switch (error.code) {
        case 'unauthorized':
          return 'Invalid Notion token. Please check your integration token and ensure it has the correct permissions.';
        case 'restricted_resource':
          return 'Access forbidden. Please ensure your integration has access to the requested page or database.';
        case 'object_not_found':
          return 'Page or database not found. Please check the URL and ensure the page/database exists and is shared with your integration.';
        case 'rate_limited':
          return 'Rate limit exceeded. Please wait a moment and try again.';
        case 'invalid_json':
          return 'Invalid request format. Please check your integration token format and try again.';
        case 'invalid_request':
          return 'Invalid request. Please check the page/database URL and try again.';
        case 'validation_error':
          return 'Validation error. Please check your request parameters.';
        case 'conflict_error':
          return 'Conflict error. The resource may have been modified by another process.';
        default:
          return `Notion API error: ${error.message || 'Unknown error'}`;
      }
    }

    if (error?.message) {
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return 'Network error: Unable to reach Notion API. Please check your internet connection and try again.';
      }
      
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        return 'Request timed out. The Notion API may be slow to respond. Please try again.';
      }

      return `Unexpected error: ${error.message}`;
    }

    return 'An unknown error occurred while connecting to Notion.';
  }

  private extractPageIdFromUrl(url: string): string | null {
    const patterns = [
      /notion\.so\/([a-f0-9]{32})/,
      /notion\.so\/.*-([a-f0-9]{32})/,
      /notion\.so\/.*\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].replace(/-/g, '');
      }
    }

    return null;
  }

  async validateToken(token: string) {
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
    }

    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.classifyNotionError(error));
      }

      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      throw new Error(this.classifyNotionError(error));
    }
  }

  async getIntegrationInfo(token: string) {
    if (!this.validateTokenFormat(token)) {
      throw new Error('Invalid token format. Notion tokens should start with "ntn_" and be at least 50 characters long.');
    }

    try {
      const response = await fetch('https://api.notion.com/v1/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.classifyNotionError(error));
      }

      const userInfo = await response.json();
      
      return {
        type: userInfo.type || 'bot',
        name: userInfo.name || 'Unknown Integration',
        capabilities: {
          read_content: true,
          read_user_info: true
        },
        workspace: userInfo.workspace ? {
          name: userInfo.workspace.name || 'Unknown Workspace',
          id: userInfo.workspace.id || ''
        } : undefined
      };
    } catch (error) {
      console.error('Failed to get integration info:', error);
      throw new Error(`Failed to retrieve integration information: ${this.classifyNotionError(error)}`);
    }
  }

  async validateAccess(url: string, token: string) {
    const pageId = this.extractPageIdFromUrl(url);
    if (!pageId) {
      return { hasAccess: false, resourceType: null, error: 'Invalid Notion URL format' };
    }

    // Try database first
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${pageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { hasAccess: true, resourceType: 'database' };
      }
    } catch (error) {
      console.log('Database access failed, trying page...');
    }

    // Try page
    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return { hasAccess: true, resourceType: 'page' };
      }
    } catch (error) {
      console.log('Page access failed');
    }

    return { 
      hasAccess: false, 
      resourceType: null, 
      error: 'Page/database not shared with integration or does not exist' 
    };
  }

  async getPage(pageId: string, token: string) {
    try {
      const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.classifyNotionError(error));
      }

      return await response.json();
    } catch (error) {
      throw new Error(this.classifyNotionError(error));
    }
  }

  async getDatabase(databaseId: string, token: string) {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.classifyNotionError(error));
      }

      return await response.json();
    } catch (error) {
      throw new Error(this.classifyNotionError(error));
    }
  }

  async queryDatabase(databaseId: string, token: string, filter?: any) {
    try {
      const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filter,
          sorts: [
            {
              property: 'Date',
              direction: 'ascending'
            }
          ]
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(this.classifyNotionError(error));
      }

      return await response.json();
    } catch (error) {
      throw new Error(this.classifyNotionError(error));
    }
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, token, pageId, databaseId, url, filter }: NotionRequest = await req.json();
    const handler = new NotionAPIHandler();

    console.log(`🔥 Notion API request: ${action}`);

    let result;
    switch (action) {
      case 'validate':
        result = await handler.validateToken(token);
        break;
      case 'getIntegrationInfo':
        result = await handler.getIntegrationInfo(token);
        break;
      case 'validateAccess':
        if (!url) throw new Error('URL is required for validateAccess');
        result = await handler.validateAccess(url, token);
        break;
      case 'getPage':
        if (!pageId) throw new Error('Page ID is required for getPage');
        result = await handler.getPage(pageId, token);
        break;
      case 'getDatabase':
        if (!databaseId) throw new Error('Database ID is required for getDatabase');
        result = await handler.getDatabase(databaseId, token);
        break;
      case 'queryDatabase':
        if (!databaseId) throw new Error('Database ID is required for queryDatabase');
        result = await handler.queryDatabase(databaseId, token, filter);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error occurred' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
