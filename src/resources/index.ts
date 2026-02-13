import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerLillyDirectStoreResource } from './lillyDirectStore.js';
import { registerLillyDirectMedicineResource } from './lillyDirectMedicine.js';
import { registerUserProfileResource } from './userProfileDynamic.js';
import { registerSavingsCardResource } from './savingsCardDynamic.js';
import { registerNearbyPharmacyMapResource } from './nearbyPharmacyMap.js';
import { registerInjectionInstructionsResource } from './injectionInstructions.js';
import { registerTroubleshootingWidgetResource } from './troubleshootingWidget.js';
import { registerProductSupportWidgetResource } from './productSupportWidget.js';
import { registerAppCapabilitiesResource } from './appCapabilities.js';

export {
  registerLillyDirectStoreResource,
  registerLillyDirectMedicineResource,
  registerUserProfileResource,
  registerSavingsCardResource,
  registerNearbyPharmacyMapResource,
  registerInjectionInstructionsResource,
  registerTroubleshootingWidgetResource,
  registerProductSupportWidgetResource,
  registerAppCapabilitiesResource,
};

/**
 * Registers all UI resources with the MCP server.
 */
export function registerAllResources(server: McpServer): void {
  registerLillyDirectStoreResource(server);
  registerLillyDirectMedicineResource(server);
  registerUserProfileResource(server);
  registerSavingsCardResource(server);
  registerNearbyPharmacyMapResource(server);
  registerInjectionInstructionsResource(server);
  registerTroubleshootingWidgetResource(server);
  registerProductSupportWidgetResource(server);
  registerAppCapabilitiesResource(server);
}
