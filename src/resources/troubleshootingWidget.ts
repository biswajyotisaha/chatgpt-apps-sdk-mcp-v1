import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TROUBLESHOOTING_DATA } from '../data.js';
import { createTroubleshootingWidgetHTML } from '../htmlMethods/index.js';

export function registerTroubleshootingWidgetResource(server: McpServer): void {
server.registerResource(
  'troubleshooting-widget-dynamic',
  'ui://widget/troubleshooting-widget-dynamic-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://troubleshooting-widget.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://uspl.lilly.com',
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => {
    // Default troubleshooting data (Zepbound) - will be replaced dynamically by tool
    const defaultTroubleshootingData = TROUBLESHOOTING_DATA['p1'];
    
    return {
      contents: [
        {
          uri: 'ui://widget/troubleshooting-widget-dynamic-v1.html',
          mimeType: 'text/html+skybridge',
          text: createTroubleshootingWidgetHTML(defaultTroubleshootingData),
          _meta: {
            'openai/widgetDomain': 'https://troubleshooting-widget.onrender.com',
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [
                'https://delivery-p137454-e1438138.adobeaemcloud.com',
                'https://uspl.lilly.com',
                'https://upload.wikimedia.org',
                'https://logosandtypes.com'
              ]
            }
          }
        },
      ]
    };
  }
);
}
