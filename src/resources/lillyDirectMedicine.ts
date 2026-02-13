import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AVAILABLE_MEDICINES } from '../data.js';
import { createMedicineCarouselHTML } from '../htmlMethods/index.js';

export function registerLillyDirectMedicineResource(server: McpServer): void {
server.registerResource(
  'lilly-direct-medicine',
  'ui://widget/lilly-direct-medicine-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://lilly-direct-medicine.onrender.com',
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
        uri: 'ui://widget/lilly-direct-medicine-v1.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML([AVAILABLE_MEDICINES[0]]),
        _meta: {
          'openai/widgetDomain': 'https://lilly-direct-medicine.onrender.com',
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
