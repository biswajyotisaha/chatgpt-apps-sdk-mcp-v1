import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createMedicineCarouselHTML } from '../htmlMethods/index.js';

export function registerLillyDirectStoreResource(server: McpServer): void {
server.registerResource(
  'lilly-direct-store',
  'ui://widget/lilly-direct-store-v2.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://lilly-direct-store.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com',
          'https://delivery-p137454-e1438138.adobeaemcloud.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/lilly-direct-store-v2.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML(),
        _meta: {
          'openai/widgetDomain': 'https://lilly-direct-store.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://logosandtypes.com',
              'https://delivery-p137454-e1438138.adobeaemcloud.com'
            ]
          }
        }
      },
    ]
  })
);

}
