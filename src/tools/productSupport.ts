import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { requireAccessToken } from '../userAuthenticationService.js';
import { createProductSupportWidgetHTML } from '../htmlMethods/index.js';
import { CAPI_GATEWAY_URL } from '../constants.js';

/**
 * Tool: Product Support & Troubleshooting
 * Shows product support and troubleshooting resources with three tabs matching the Lilly product help page:
 * - Product support: For product issues, device troubleshooting, and questions
 * - Shipping-related issues: For delivery/handling concerns  
 * - Report a possible side effect: For reporting side effects
 * No authentication required - accessible to all users.
 * 
 * Triggered when a user asks:
 * - Product support / Product help
 * - Issue with my medicine / Issue with my product
 * - Troubleshooting / Troubleshoot my device / Pen not working / Pen not clicking
 * - Problem with my device / Device issue / Product problem
 * - Shipping problem / Shipping issue / Delivery issue
 * - Report side effect / Side effects
 * - Problem with my Mounjaro / Zepbound
 * - Help with my medication
 * - Contact Lilly about product
 */
export function registerProductSupportTool(server: McpServer): void {
  server.registerTool(
    'product-support',
    {
      title: 'Product Support & Troubleshooting',
      description: 'Shows product support and troubleshooting resources for Mounjaro and Zepbound medications. ALWAYS use this when a user needs troubleshooting help, has device issues (e.g., pen not clicking, pen not working), has product problems, needs product support, has shipping problems, wants to report a side effect, or needs help with their Lilly product. Covers product quality concerns, device troubleshooting, shipping/delivery issues, and side effect reporting.',
      _meta: {
        'openai/outputTemplate': 'ui://widget/product-support-v1.html',
        'openai/toolInvocation/invoking': 'Loading product support & troubleshooting resources...',
        'openai/toolInvocation/invoked': 'Product support & troubleshooting resources loaded successfully'
      },
      inputSchema: {}
    },
    async () => {
      console.log('🛟 Product Support tool invoked');
      
      // Fetch user profile server-side to embed in widget
      let userProfile: any = null;
      try {
        const userToken = await requireAccessToken();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const profileResponse = await fetch(`${CAPI_GATEWAY_URL}/v1/userAggregate`, {
          method: 'GET',
          headers: { 
            Authorization: `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          userProfile = profileData.profile || null;
          console.log('✅ User profile fetched for product support widget');
          console.log('📋 Profile data structure:', JSON.stringify(userProfile, null, 2));
          if (userProfile?.primaryResidence) {
            console.log('🏠 primaryResidence:', JSON.stringify(userProfile.primaryResidence, null, 2));
          }
        }
      } catch (error: any) {
        console.warn('⚠️ Could not fetch user profile for widget:', error.message);
      }
      
      // Create dynamic product support widget with embedded profile
      const productSupportHTML = createProductSupportWidgetHTML(userProfile);
      
      const dynamicResource = {
        uri: 'ui://widget/product-support-v1.html',
        mimeType: 'text/html+skybridge',
        text: productSupportHTML
      };

      return {
        content: [
          { 
            type: 'text' as const, 
            text: 'Here are the product support resources for Mounjaro® and Zepbound®. Select your concern from the tabs: Product support for quality/usability issues, Shipping-related issues for delivery problems, or Report a possible side effect.'
          }
        ],
        structuredContent: {
          supportType: 'product-support',
          tabs: ['Product support', 'Shipping-related issues', 'Report a possible side effect'],
          products: ['Mounjaro® (tirzepatide)', 'Zepbound® (tirzepatide)'],
          profile: userProfile
        },
        _meta: {
          'openai/dynamicContent': dynamicResource
        }
      };
    }
  );
}
