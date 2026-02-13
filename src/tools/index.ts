import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerWhatCanThisAppDoTool } from './whatCanThisAppDo.js';
import { registerShowInjectionInstructionsTool } from './showInjectionInstructions.js';
import { registerBuyMedicinesOnlineTool } from './buyMedicinesOnline.js';
import { registerGetUserProfileTool } from './getUserProfile.js';
import { registerGetSavingsCardTool } from './getSavingsCard.js';
import { registerShopMedicineTool } from './shopMedicine.js';
import { registerFindNearbyPharmaciesTool } from './findNearbyPharmacies.js';
import { registerProductSupportTool } from './productSupport.js';

export {
  registerWhatCanThisAppDoTool,
  registerShowInjectionInstructionsTool,
  registerBuyMedicinesOnlineTool,
  registerGetUserProfileTool,
  registerGetSavingsCardTool,
  registerShopMedicineTool,
  registerFindNearbyPharmaciesTool,
  registerProductSupportTool,
};

/**
 * Registers all tools with the MCP server.
 */
export function registerAllTools(server: McpServer): void {
  registerWhatCanThisAppDoTool(server);
  registerShowInjectionInstructionsTool(server);
  registerBuyMedicinesOnlineTool(server);
  registerGetUserProfileTool(server);
  registerGetSavingsCardTool(server);
  registerShopMedicineTool(server);
  registerFindNearbyPharmaciesTool(server);
  registerProductSupportTool(server);
}
