import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createProductSupportWidgetHTML } from '../htmlMethods/index.js';

export function registerProductSupportWidgetResource(server: McpServer): void {
server.registerResource(
  'product-support-widget',
  'ui://widget/product-support-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://product-support.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com',
          'https://gifthealth.zendesk.com',
          'https://val-safety-reporting-public.lilly.com'
        ],
        resource_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com',
          'https://gifthealth.zendesk.com',
          'https://val-safety-reporting-public.lilly.com'
        ],
        media_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com'
        ]
      }
    }
  },
  async () => {
    return {
      contents: [
        {
          uri: 'ui://widget/product-support-v1.html',
          mimeType: 'text/html+skybridge',
          text: createProductSupportWidgetHTML(),
          _meta: {
            'openai/widgetDomain': 'https://product-support.onrender.com',
            'openai/widgetCSP': {
              connect_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com',
                'https://gifthealth.zendesk.com',
                'https://val-safety-reporting-public.lilly.com'
              ],
              resource_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com',
                'https://gifthealth.zendesk.com',
                'https://val-safety-reporting-public.lilly.com'
              ],
              media_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com'
              ]
            }
          }
        },
      ]
    };
  }
);
}
