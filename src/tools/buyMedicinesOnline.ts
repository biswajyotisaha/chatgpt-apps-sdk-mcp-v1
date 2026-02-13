import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AVAILABLE_MEDICINES } from '../data.js';
import { MedicineData } from '../types.js';

/**
 * Tool: Buy Medicines Online
 * Shows all FDA-approved medicines available for purchase on Lilly Direct online store.
 * Provides direct links to shop and buy medicines from Lilly Direct.
 * No authentication required - public tool accessible to all users.
 */
export function registerBuyMedicinesOnlineTool(server: McpServer): void {
  server.registerTool(
    'buy-medicines-online',
    {
      title: 'Buy Medicines Online from Lilly Direct',
      description: 'Browse and shop FDA-approved medicines available for purchase on Lilly Direct online pharmacy. Use this when a user wants to buy, purchase, order, or shop for medicines online, or needs links to the Lilly Direct store.',
      _meta: {
        'openai/outputTemplate': 'ui://widget/lilly-direct-store-v2.html',
        'openai/toolInvocation/invoking': 'Loading Lilly Direct online store...',
        'openai/toolInvocation/invoked': 'Lilly Direct store loaded successfully',
        'securitySchemes': [
          { type: 'oauth2', scopes: ['openid', 'profile'] }
        ]
      },
      inputSchema: {}
    },
    async () => {
      const medicineData: MedicineData = {
        items: AVAILABLE_MEDICINES,
        total_count: AVAILABLE_MEDICINES.length
      };
      
      return {
        content: [
          { 
            type: 'text', 
            text: `Here are ${AVAILABLE_MEDICINES.length} FDA-approved medicines you can buy online from Lilly Direct. Click on any medicine to shop directly from the Lilly Direct online pharmacy.`
          }
        ],
        structuredContent: medicineData
      };
    }
  );
}
