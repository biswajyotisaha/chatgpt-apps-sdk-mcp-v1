import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { AVAILABLE_MEDICINES } from '../data.js';
import { MedicineData } from '../types.js';
import { createMedicineCarouselHTML } from '../htmlMethods/index.js';

/**
 * Tool: Shop Medicine on Lilly Direct
 * Shows a specific medicine available for purchase on Lilly Direct online store.
 * Provides direct link to buy the medicine from Lilly Direct pharmacy.
 * Supports optional authentication for personalized experience.
 */
export function registerShopMedicineTool(server: McpServer): void {
  server.registerTool(
    'shop-medicine',
    {
      title: 'Shop Medicine on Lilly Direct',
      description: 'Get purchase link for a specific medicine on Lilly Direct online pharmacy. Use this when a user wants to buy, purchase, order, or shop for a specific medicine like Zepbound, Humalog, Humulin, Emgality, Basaglar, Lyumjev, or Rezvoglar.',
      _meta: {
        'openai/outputTemplate': 'ui://widget/lilly-direct-medicine-v1.html',
        'openai/toolInvocation/invoking': 'Loading Lilly Direct purchase options...',
        'openai/toolInvocation/invoked': 'Medicine purchase options loaded successfully',
        'securitySchemes': [
          { type: 'noauth' },
          { type: 'oauth2', scopes: ['openid', 'profile'] }
        ]
      },
      inputSchema: {
        medicineName: z.string().describe('Name of the medicine to display')
      } as any
    },
    async (args: any) => {
      const medicine = AVAILABLE_MEDICINES.find(med => 
        med.name.toLowerCase().includes(args.medicineName.toLowerCase())
      );
      
      if (!medicine) {
        return {
          content: [
            { 
              type: 'text' as const, 
              text: `Medicine "${args.medicineName}" not found. Available medicines: ${AVAILABLE_MEDICINES.map(m => m.name).join(', ')}`
            }
          ],
          structuredContent: { items: [], total_count: 0, medicineName: args.medicineName }
        };
      }

      // Generate HTML for the medicine purchase page
      const singleMedicineHTML = createMedicineCarouselHTML([medicine]);
      
      // Create a dynamic resource for Lilly Direct medicine page
      const dynamicResource = {
        uri: 'ui://widget/lilly-direct-medicine-v1.html',
        mimeType: 'text/html+skybridge',
        text: singleMedicineHTML
      };

      const medicineData: MedicineData = {
        items: [medicine],
        total_count: 1,
        medicineName: medicine.name
      };
      
      return {
        content: [
          { 
            type: 'text' as const, 
            text: `Here's ${medicine.name} - available for purchase on Lilly Direct online pharmacy. Click the button to buy directly from Lilly Direct.`
          }
        ],
        structuredContent: medicineData,
        _meta: {
          'openai/dynamicContent': dynamicResource
        }
      };
    }
  );
}
