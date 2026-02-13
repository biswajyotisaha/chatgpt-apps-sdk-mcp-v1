import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { requireAccessToken } from '../userAuthenticationService.js';
import { CAPI_GATEWAY_URL } from '../constants.js';

/**
 * Tool: Get User Profile
 * Fetches authenticated user profile data from AWS API Gateway.
 * Requires OAuth authentication - uses user's token from ChatGPT.
 * Returns user profile data to render in the user-profile widget.
 */
export function registerGetUserProfileTool(server: McpServer): void {
  server.registerTool(
    'get-user-profile',
    {
      title: 'Get User Profile',
      description: 'Fetch authenticated user profile from AWS API using the user\'s ChatGPT OAuth token',
      _meta: {
        'openai/outputTemplate': 'ui://widget/user-profile-dynamic-v1.html',
        'openai/toolInvocation/invoking': 'Fetching user profile...',
        'openai/toolInvocation/invoked': 'User profile loaded successfully'
      },
      inputSchema: {}
    },
    async () => {
      const userToken = await requireAccessToken();
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${CAPI_GATEWAY_URL}/v1/userAggregate`, {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', response.status, errorText);
          throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const profile = data.profile || {};
        
        const fullName = `${profile.givenName || ''} ${profile.familyName || ''}`.trim() || 'User';
        
        return {
          content: [{ type: 'text', text: `Profile loaded for ${fullName}` }],
          structuredContent: { profile: profile }
        };
      } catch (error: any) {
        console.error('Failed to fetch user profile:', error.message);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    }
  );
}
