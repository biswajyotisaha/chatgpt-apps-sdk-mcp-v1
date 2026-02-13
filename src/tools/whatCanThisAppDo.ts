import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { APP_CAPABILITIES } from '../data.js';

/**
 * Tool: What Can This App Do
 * Returns a summary of all available tools and capabilities in this Lilly Direct app.
 * Helps users understand the full range of features they can use.
 * No authentication required - accessible to all users.
 * 
 * Triggered when a user asks:
 * - What can this app do?
 * - What features are available?
 * - What tools do you have?
 * - Help / How can you help me?
 * - What can I do here?
 * - Show me what's available
 */
export function registerWhatCanThisAppDoTool(server: McpServer): void {
  server.registerTool(
    'what-can-this-app-do',
    {
      title: 'What Can This App Do',
      description: 'Summarizes all available features and tools in this Lilly app. Use this when a user asks what this app can do, what features or tools are available, what help is offered, or wants an overview of capabilities.',
      _meta: {
        'openai/outputTemplate': 'ui://widget/app-capabilities-v1.html',
        'openai/toolInvocation/invoking': 'Gathering available features...',
        'openai/toolInvocation/invoked': 'Here\'s everything this app can do'
      },
      inputSchema: {}
    },
    async () => {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Here\'s everything you can do with the Lilly app. Browse the categories below to see all available features.'
          }
        ],
        structuredContent: {
          categories: APP_CAPABILITIES
        }
      };
    }
  );
}
