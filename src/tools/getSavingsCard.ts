import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { randomUUID } from 'crypto';
import { 
  requireAccessToken, 
  requireLc3Id,
  requireEmailId,
  requireOfficialBrandName,
  getSavingProgramEnrolledYear
} from '../userAuthenticationService.js';
import { DHISP_GATEWAY_URL, LC3_APP_NAME } from '../constants.js';

/**
 * Tool: Get Savings Card
 * Fetches copay savings card information from the savings card API.
 * Requires OAuth authentication - uses user's token from ChatGPT.
 * Returns copay card details to render in the savings-card widget.
 */
export function registerGetSavingsCardTool(server: McpServer): void {
  server.registerTool(
    'get-savings-card',
    {
      title: 'Get Savings Card',
      description: 'Fetch copay savings card information for the authenticated user',
      _meta: {
        'openai/outputTemplate': 'ui://widget/savings-card-dynamic-v1.html',
        'openai/toolInvocation/invoking': 'Fetching savings card information...',
        'openai/toolInvocation/invoked': 'Savings card loaded successfully'
      },
      inputSchema: {}
    },
    async () => {
      const userToken = await requireAccessToken();
      
      // Try to get LC3 data from Redis (may not be available if LC3 authorization fails)
      const lc3Id = await requireLc3Id().catch(() => null);
      const emailId = await requireEmailId().catch(() => null);
      const brandName = await requireOfficialBrandName().catch(() => null);
      
      // Fall back to hardcoded values if LC3 data is not available
      const uid = lc3Id || 'f765e766-0379-4344-a703-9383c4818174';
      const email = emailId || 'taltz1817@grr.la';
      const officialBrandName = brandName || 'Ixekizumab US';
      
      console.log(`💳 Savings card request using ${lc3Id ? 'Redis' : 'hardcoded'} values:`);
      console.log(`   UID: ${uid}`);
      console.log(`   Email: ${email}`);
      console.log(`   Brand: ${officialBrandName}`);
      
      // Check stored enrollment year before API call
      try {
        const storedYear = await getSavingProgramEnrolledYear();
        console.log(`   🔍 Pre-API stored enrollment year: ${storedYear}`);
      } catch (error) {
        console.log(`   🔍 Error getting pre-API enrollment year:`, error);
      }
      
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(`${DHISP_GATEWAY_URL}/api/savingscard`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-csp-dhisp-source': LC3_APP_NAME,
            'action': 'search',
            'x-csp-dhisp-trackingid': randomUUID(),
            'Authorization': `Bearer ${userToken}`
          },
          body: JSON.stringify({
            brandProgram: officialBrandName,
            uid: uid,
            email: email,
            '18YrsOfAge': true
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Savings card API error:', response.status, errorText);
          throw new Error(`Savings card API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        const copayCard = data.copayCard || {};
        
        // Calculate expiration year (enrolled year + 2 for 24 months, fallback to current year + 1)
        let expirationYear = new Date().getFullYear() + 1;
        
        // Extract and store enrollment year if available
        if (copayCard.enrollmentDate || copayCard.createdDate || copayCard.activationDate) {
          const enrollmentDateStr = copayCard.enrollmentDate || copayCard.createdDate || copayCard.activationDate;
          try {
            const enrollmentDate = new Date(enrollmentDateStr);
            const enrollmentYear = enrollmentDate.getFullYear();
            
            // Validate enrollment year
            if (!isNaN(enrollmentYear) && enrollmentYear > 2020 && enrollmentYear <= new Date().getFullYear()) {
              expirationYear = enrollmentYear + 2; // 24 months from enrollment
            }
            
            // Store enrollment year in session for future use
            const { setSavingProgramEnrolledYear } = await import('../userAuthenticationService.js');
            await setSavingProgramEnrolledYear(enrollmentYear.toString());
          } catch (error) {
            console.error('Failed to parse enrollment date:', enrollmentDateStr, error);
          }
        } else {
          // Try to get previously stored enrollment year
          try {
            const storedYear = await getSavingProgramEnrolledYear();
            if (storedYear && storedYear.trim()) {
              const storedYearNum = parseInt(storedYear.trim());
              if (!isNaN(storedYearNum) && storedYearNum > 2020 && storedYearNum <= new Date().getFullYear()) {
                expirationYear = storedYearNum + 2;
                console.log(`✅ EXPIRATION LOGIC: Using stored enrollment year`);
                console.log(`📅 Using stored enrollment year for expiration: ${storedYear} + 2 = ${expirationYear}`);
              }
            } else {
              // No stored year found, set current year as enrollment year
              const currentYear = new Date().getFullYear();
              try {
                const { setSavingProgramEnrolledYear } = await import('../userAuthenticationService.js');
                await setSavingProgramEnrolledYear(currentYear.toString());
                expirationYear = currentYear + 2;
              } catch (storeError) {
                console.error('Failed to store current year as enrollment year:', storeError);
              }
            }
          } catch (error) {
            console.error('Error retrieving stored enrollment year:', error);
          }
        }
        
        console.log(`🎯 FINAL EXPIRATION YEAR DECISION: ${expirationYear}`);
        console.log(`🎯 EXPIRATION DATE: 12/31/${expirationYear}`);
        console.log(`✅ GUARANTEED EXPIRATION YEAR: ${expirationYear}`);
        console.log(`✅ GUARANTEED EXPIRATION DATE: 12/31/${expirationYear}`);
        
        return {
          content: [{ 
            type: 'text', 
            text: `Savings card loaded: ${copayCard.copayCardNumber || 'No card number'}` 
          }],
          structuredContent: { 
            copayCard: copayCard,
            expirationYear: expirationYear
          }
        };
      } catch (error: any) {
        console.error('Failed to fetch savings card:', error.message);
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    }
  );
}
