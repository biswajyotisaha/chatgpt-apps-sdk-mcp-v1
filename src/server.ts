import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { AVAILABLE_MEDICINES } from './data.js';
import { MedicineData } from './types.js';
import { 
  setAccessToken, 
  getAccessToken,
  requireAccessToken, 
  setLc3Jwt, 
  requireLc3Jwt, 
  setLc3Id,
  requireLc3Id,
  setBrand, 
  requireBrand,
  setEmailId,
  requireEmailId,
  setOfficialBrandName,
  requireOfficialBrandName,
  getOfficialBrandName,
  extractPatientId,
  getSavingProgramEnrolledYear,
  setSavingProgramEnrolledYear
} from './userAuthenticationService.js';
import { sessionManager } from './sessionManager.js';
import { setRequestContext, clearRequestContext } from './userAuthenticationService.js';
import { createMedicineCarouselHTML, createProductSupportWidgetHTML } from './htmlMethods/index.js';
import { registerAllResources } from './resources/index.js';


// ==================== EXPRESS APP SETUP ====================

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const capiGatewayUrl = process.env.CAPI_GATEWAY_URL || 'https://consumer-api.iv.apps.lilly.com';
const lc3GatewayUrl = process.env.LC3_GATEWAY_URL || 'https://lillytogether-gateway.iv.connectedcarecloud.com';
const dhispGatewayUrl = process.env.DHISP_GATEWAY_URL || 'https://qa.ext-llydhisp.net/digh-lillytogether-test-xapi-v2';

// LC3 Gateway Headers (hardcoded - simulating mobile app device)
const LC3_IDENTITY_PROVIDER = 'okta';
const LC3_DEVICE_OS_VERSION = '18.7.1';
const LC3_DEVICE = 'iPhone14,7';
const LC3_DEVICE_MANUFACTURER = 'Apple Inc';
const LC3_APP_NAME = 'lillyplus';
const LC3_APP_VERSION = '19.0.0';
const LC3_DEVICE_OS = 'ios';

// Configure CORS to allow requests from ChatGPT
app.use(cors({
  origin: ['https://chatgpt.com'],
  methods: ['GET', 'POST', 'OPTIONS', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-mcp-session-id'],
  credentials: true
}));

// Serve static files from the public directory
app.use('/public', express.static('public'));

// ==================== MCP SERVER SETUP ====================

const server = new McpServer({
  name: 'chatgpt-apps-sdk-mcp',
  version: '1.0.0'
});

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

// ==================== UI RESOURCES ====================

// Register all UI resources (defined in src/resources/)
registerAllResources(server);

// ==================== TOOLS ====================

/**
 * Tool: What Can This App Do
 * Returns a summary of all available tools and capabilities in this Lilly Direct app.
 * Helps users understand the full range of features they can use.
 * No authentication required - accessible to all users.
 * 
 * Triggered when a user asks:
 * - What can this app do?
 * - What features are available?
 * - What tools do you have?
 * - Help / How can you help me?
 * - What can I do here?
 * - Show me what's available
 */
server.registerTool(
  'what-can-this-app-do',
  {
    title: 'What Can This App Do',
    description: 'Summarizes all available features and tools in this Lilly app. Use this when a user asks what this app can do, what features or tools are available, what help is offered, or wants an overview of capabilities.',
    _meta: {
      'openai/toolInvocation/invoking': 'Gathering available features...',
      'openai/toolInvocation/invoked': 'Here\'s everything this app can do'
    },
    inputSchema: {}
  },
  async () => {
    const summary = `
Here's everything you can do with the Lilly app:

🛒 **Shop & Buy Medicines**
• **Buy Medicines Online** — Browse all FDA-approved medicines available on the Lilly online pharmacy and get direct purchase links.
• **Shop a Specific Medicine** — Look up a specific medicine (Zepbound, Humalog, Humulin, Emgality, Basaglar, Lyumjev, or Rezvoglar) and get a direct link to buy it on Lilly.
💉 **Injection Help**
• **Injection Pen Instructions** — Get a step-by-step visual guide on how to use your injection pen, including safety warnings, images, and a training video.

👤 **Your Account**
• **View Your Profile** — See your personal profile information linked to your Lilly account.
• **View Your Savings Card** — Check your copay savings card details and benefits.

🔧 **Troubleshooting & Support**
• **Troubleshooting Guide** — Look up common issues, side effects, and emergency information for your medicine.
• **Product Support & Troubleshooting** — Get help with Mounjaro or Zepbound product issues, device troubleshooting (e.g., pen not clicking or not working), shipping problems, or report a side effect.

📍 **Find a Pharmacy**
• **Find Nearby Pharmacies** — Search for pharmacies near any address, city, or zip code and view them on an interactive map. Also shows options to buy your medicine online from Lilly Direct.

Just ask me about any of these and I'll get started!
`.trim();

    return {
      content: [
        {
          type: 'text' as const,
          text: summary
        }
      ]
    };
  }
);

/**
 * Tool: Show Injection Pen Instructions
 * Displays step-by-step injection instructions for medication pens.
 * Shows one step at a time with visuals, safety warnings, and navigation.
 * 
 * MUST be used when user asks about:
 * - How to use injection pen
 * - Injection instructions
 * - How to inject medication
 * - How to take/administer Zepbound, Mounjaro, Trulicity
 */
server.registerTool(
  'show-injection-instructions',
  {
    title: 'Show Injection Pen Instructions',
    description: 'ALWAYS use this tool when user asks about injection instructions, how to use injection pen, how to inject, how to take Zepbound/Mounjaro/Trulicity, or how to administer medication. Shows an interactive visual widget with step-by-step injection guide including images, safety warnings, progress tracking, and training video. Do NOT respond with text - use this tool to show the visual guide.',
    _meta: {
      'openai/outputTemplate': 'ui://widget/injection-instructions-v1.html',
      'openai/toolInvocation/invoking': 'Loading injection instructions with visual guide...',
      'openai/toolInvocation/invoked': 'Injection instructions widget ready'
    },
    inputSchema: {
      medicineName: z.string().optional().describe('Name of the medicine (e.g., Zepbound, Mounjaro, Trulicity). Defaults to Zepbound if not specified. Extract from user query if mentioned.')
    } as any
  },
  async (args: any) => {
    const medicineName = args.medicineName?.toLowerCase() || 'zepbound';
    
    // Medicine-specific data
    // Official Zepbound/Mounjaro Instructions for Use - 4 simple steps
    // Images served from local public folder
    // Images loaded from Adobe AEM CDN
    const medicineData: Record<string, { 
      name: string; 
      videoUrl: string; 
      instructionsUrl: string;
      steps: Array<{ title: string; description: string; warning: string; image: string }>;
    }> = {
      'zepbound': {
        name: 'Zepbound®',
        videoUrl: 'https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4',
        instructionsUrl: 'https://uspl.lilly.com/zepbound/zepbound.html#ug',
        steps: [
          {
            title: "Step 1: Choose Your Injection Site",
            description: "You may inject Zepbound in your stomach (abdomen) at least 2 inches away from your belly button, in the front of your thigh, or in the back of your upper arm (with help from another person). Choose a different injection site each week.",
            warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d0514e55-3fb6-4541-a31a-dd466f7ad415/as/injection_step_1.avif?assetname=injection_step_1.png&width=1200&format=avif"
          },
          {
            title: "Step 2: Pull Off the Gray Base Cap",
            description: "Pull off the gray base cap while the pen is locked. Do not put the gray base cap back on — this could damage the needle. You may see a few drops of medicine on the needle or clear base. This is normal.",
            warning: "Do not touch the needle. After you remove the cap, you must use the pen within 5 minutes.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:66d7adbb-0a6a-4cbe-a622-2e305f2136b3/as/injection_step_2.avif?assetname=injection_step_2.png&width=1200&format=avif"
          },
          {
            title: "Step 3: Place on Skin and Unlock",
            description: "Place the clear base flat on your skin at your chosen injection site. Make sure you can see the medicine window. Then turn the lock ring to unlock the pen.",
            warning: "Do not press the injection button until the clear base is flat against your skin and the pen is unlocked.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:7248da27-e860-4a4f-911e-700f4162987f/as/injection_step_3.avif?assetname=injection_step_3.png&width=1200&format=avif"
          },
          {
            title: "Step 4: Press and Hold the Button",
            description: "Press and hold the purple injection button for up to 10 seconds. Listen for the first click — it means the injection has started. Keep holding. When you hear the second click, the injection is complete. You may now lift the pen.",
            warning: "Do not lift the pen until you hear the second click. If the gray plunger is NOT visible in the window after injection, contact your healthcare provider.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:ad1c3410-ec02-447b-8f83-e9ac5eb1741e/as/injection_step_4.avif?assetname=injection_step_4.png&width=1200&format=avif"
          }
        ]
      },
      'mounjaro': {
        name: 'Mounjaro®',
        videoUrl: 'https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4',
        instructionsUrl: 'https://uspl.lilly.com/mounjaro/mounjaro.html#ug',
        steps: [
          {
            title: "Step 1: Choose Your Injection Site",
            description: "You may inject Mounjaro in your stomach (abdomen) at least 2 inches away from your belly button, in the front of your thigh, or in the back of your upper arm (with help from another person). Choose a different injection site each week.",
            warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d0514e55-3fb6-4541-a31a-dd466f7ad415/as/injection_step_1.avif?assetname=injection_step_1.png&width=1200&format=avif"
          },
          {
            title: "Step 2: Pull Off the Gray Base Cap",
            description: "Pull off the gray base cap while the pen is locked. Do not put the gray base cap back on — this could damage the needle. You may see a few drops of medicine on the needle or clear base. This is normal.",
            warning: "Do not touch the needle. After you remove the cap, you must use the pen within 5 minutes.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:66d7adbb-0a6a-4cbe-a622-2e305f2136b3/as/injection_step_2.avif?assetname=injection_step_2.png&width=1200&format=avif"
          },
          {
            title: "Step 3: Place on Skin and Unlock",
            description: "Place the clear base flat on your skin at your chosen injection site. Make sure you can see the medicine window. Then turn the lock ring to unlock the pen.",
            warning: "Do not press the injection button until the clear base is flat against your skin and the pen is unlocked.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:7248da27-e860-4a4f-911e-700f4162987f/as/injection_step_3.avif?assetname=injection_step_3.png&width=1200&format=avif"
          },
          {
            title: "Step 4: Press and Hold the Button",
            description: "Press and hold the purple injection button for up to 10 seconds. Listen for the first click — it means the injection has started. Keep holding. When you hear the second click, the injection is complete. You may now lift the pen.",
            warning: "Do not lift the pen until you hear the second click. If the gray plunger is NOT visible in the window after injection, contact your healthcare provider.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:ad1c3410-ec02-447b-8f83-e9ac5eb1741e/as/injection_step_4.avif?assetname=injection_step_4.png&width=1200&format=avif"
          }
        ]
      }
    };

    // Get medicine data or default to Zepbound
    const medicine = medicineData[medicineName] || medicineData['zepbound'];
    const displayName = medicine.name;

    return {
      content: [
        { 
          type: 'text' as const, 
          text: `Here are the step-by-step injection instructions for ${displayName}. Use the Next and Back buttons to navigate through each step. A training video is also available.`
        }
      ],
      structuredContent: {
        medicineName: displayName,
        steps: medicine.steps,
        videoUrl: medicine.videoUrl,
        instructionsUrl: medicine.instructionsUrl,
        totalSteps: medicine.steps.length
      }
    };
  }
);

/**
 * Tool: Buy Medicines Online
 * Shows all FDA-approved medicines available for purchase on Lilly Direct online store.
 * Provides direct links to shop and buy medicines from Lilly Direct.
 * No authentication required - public tool accessible to all users.
 */
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

/**
 * Tool: Get User Profile
 * Fetches authenticated user profile data from AWS API Gateway.
 * Requires OAuth authentication - uses user's token from ChatGPT.
 * Returns user profile data to render in the user-profile widget.
 */
server.registerTool(
  'get-user-profile',
  {
    title: 'Get User Profile',
    description: 'Fetch authenticated user profile from AWS API using the user\'s ChatGPT OAuth token',
    _meta: {
      'openai/outputTemplate': 'ui://widget/user-profile-dynamic-v1.html',
      'openai/toolInvocation/invoking': 'Fetching user profile...',
      'openai/toolInvocation/invoked': 'User profile loaded successfully'
    },
    inputSchema: {}
  },
  async () => {
    const userToken = await requireAccessToken();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      const response = await fetch(`${capiGatewayUrl}/v1/userAggregate`, {
        method: 'GET',
        headers: { 
          Authorization: `Bearer ${userToken}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error:', response.status, errorText);
        throw new Error(`API request failed: ${response.status}`);
      }
      
      const data = await response.json();
      const profile = data.profile || {};
      
      const fullName = `${profile.givenName || ''} ${profile.familyName || ''}`.trim() || 'User';
      
      return {
        content: [{ type: 'text', text: `Profile loaded for ${fullName}` }],
        structuredContent: { profile: profile }
      };
    } catch (error: any) {
      console.error('Failed to fetch user profile:', error.message);
      if (error.name === 'AbortError') {
        throw new Error('Request timed out');
      }
      throw error;
    }
  }
);

/**
 * Tool: Get Savings Card
 * Fetches copay savings card information from the savings card API.
 * Requires OAuth authentication - uses user's token from ChatGPT.
 * Returns copay card details to render in the savings-card widget.
 */
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
      
      const response = await fetch(`${dhispGatewayUrl}/api/savingscard`, {
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
          const { setSavingProgramEnrolledYear } = await import('./userAuthenticationService.js');
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
              const { setSavingProgramEnrolledYear } = await import('./userAuthenticationService.js');
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

/**
 * Tool: Shop Medicine on Lilly Direct
 * Shows a specific medicine available for purchase on Lilly Direct online store.
 * Provides direct link to buy the medicine from Lilly Direct pharmacy.
 * Supports optional authentication for personalized experience.
 */
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

/**
 * Tool: Find Nearby Pharmacies
 * Finds pharmacies near a given location and displays them on an interactive map.
 * Uses OpenStreetMap/Nominatim for geocoding and pharmacy search.
 * If a specific medicine is mentioned, shows a Lilly Direct purchase banner for that medicine above the map.
 * If no specific medicine is mentioned, shows a carousel of all available Lilly Direct medicines above the map.
 * Returns pharmacy locations and medicine data to render in the nearby-pharmacy-map widget.
 */
server.registerTool(
  'find-nearby-pharmacies',
  {
    title: 'Find Nearby Pharmacies',
    description: 'Find pharmacies near a location and display them on an interactive map. You can provide an address, city, or zip code. Also shows options to buy medicines online from Lilly Direct. If the user mentions a specific medicine, it highlights that medicine with a direct purchase link.',
    _meta: {
      'openai/outputTemplate': 'ui://widget/nearby-pharmacy-map-v1.html',
      'openai/toolInvocation/invoking': 'Searching for nearby pharmacies...',
      'openai/toolInvocation/invoked': 'Nearby pharmacies found'
    },
    inputSchema: {
      location: z.string().describe('Address, city name, or zip code to search near (e.g., "Indianapolis, IN" or "46225")'),
      medicineName: z.string().optional().describe('Optional: name of a specific medicine the user is looking for (e.g., "Zepbound", "Humalog"). If provided, shows a direct buy link for that medicine from Lilly Direct.')
    } as any
  },
  async (args: any) => {
    const location = args.location;
    const requestedMedicine = args.medicineName?.toLowerCase() || null;
    
    console.log(`🏥 Searching for pharmacies near: ${location}${requestedMedicine ? ` (looking for ${requestedMedicine})` : ''}`);
    
    // Resolve medicine data
    let medicineInfo: any = null;
    if (requestedMedicine) {
      const found = AVAILABLE_MEDICINES.find(med => 
        med.name.toLowerCase().includes(requestedMedicine)
      );
      if (found) {
        medicineInfo = { type: 'single', items: [found] };
      }
    }
    // If no specific medicine found or none requested, show all
    if (!medicineInfo) {
      medicineInfo = { type: 'all', items: AVAILABLE_MEDICINES };
    }
    
    console.log(`🏥 Searching for pharmacies near: ${location}`);
    
    try {
      // Step 1: Geocode the user's location using Nominatim
      const geocodeController = new AbortController();
      const geocodeTimeout = setTimeout(() => geocodeController.abort(), 10000);
      
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`;
      
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'LillyMCPServer/1.0 (contact@lilly.com)'
        },
        signal: geocodeController.signal
      });
      
      clearTimeout(geocodeTimeout);
      
      if (!geocodeResponse.ok) {
        throw new Error('Failed to geocode location');
      }
      
      const geocodeData = await geocodeResponse.json();
      
      if (!geocodeData.length) {
        return {
          content: [{ type: 'text' as const, text: `Could not find location: "${location}". Please try a different address or zip code.` }],
          structuredContent: { 
            error: 'Location not found. Please try a different address.',
            pharmacies: [],
            userLocation: null,
            lillyDirect: medicineInfo
          }
        };
      }
      
      const userLat = parseFloat(geocodeData[0].lat);
      const userLng = parseFloat(geocodeData[0].lon);
      const displayName = geocodeData[0].display_name;
      
      console.log(`📍 User location: ${userLat}, ${userLng} (${displayName})`);
      
      // Step 2: Search for pharmacies near the location using Nominatim
      const searchRadius = 0.05; // ~5km radius in degrees
      const pharmacyController = new AbortController();
      const pharmacyTimeout = setTimeout(() => pharmacyController.abort(), 15000);
      
      const pharmacyUrl = `https://nominatim.openstreetmap.org/search?format=json&q=pharmacy&bounded=1&viewbox=${userLng - searchRadius},${userLat + searchRadius},${userLng + searchRadius},${userLat - searchRadius}&limit=10`;
      
      const pharmacyResponse = await fetch(pharmacyUrl, {
        headers: {
          'User-Agent': 'LillyMCPServer/1.0 (contact@lilly.com)'
        },
        signal: pharmacyController.signal
      });
      
      clearTimeout(pharmacyTimeout);
      
      let pharmacies: any[] = [];
      
      if (pharmacyResponse.ok) {
        const pharmacyData = await pharmacyResponse.json();
        
        pharmacies = pharmacyData.map((item: any, index: number) => ({
          id: index + 1,
          name: item.display_name.split(',')[0] || `Pharmacy ${index + 1}`,
          address: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          phone: '(800) 555-' + String(1000 + index).padStart(4, '0'),
          hours: '8:00 AM - 9:00 PM'
        }));
      }
      
      // If no pharmacies found, generate sample pharmacies for demo
      if (pharmacies.length === 0) {
        console.log('📍 No pharmacies found via API, generating sample locations');
        
        // Generate sample pharmacies around the user's location
        const samplePharmacies = [
          { name: 'CVS Pharmacy', offset: [0.008, 0.005] },
          { name: 'Walgreens', offset: [-0.006, 0.008] },
          { name: 'Rite Aid', offset: [0.004, -0.007] },
          { name: 'Kroger Pharmacy', offset: [-0.009, -0.004] },
          { name: 'Walmart Pharmacy', offset: [0.012, 0.002] },
          { name: 'Costco Pharmacy', offset: [-0.003, 0.011] },
          { name: 'Target Pharmacy', offset: [0.007, -0.009] },
          { name: 'Meijer Pharmacy', offset: [-0.010, 0.006] }
        ];
        
        pharmacies = samplePharmacies.map((pharm, index) => ({
          id: index + 1,
          name: pharm.name,
          address: `${1000 + index * 100} Main Street, ${location}`,
          lat: userLat + pharm.offset[0],
          lng: userLng + pharm.offset[1],
          phone: '(800) 555-' + String(1000 + index).padStart(4, '0'),
          hours: '8:00 AM - 9:00 PM'
        }));
      }
      
      console.log(`✅ Found ${pharmacies.length} pharmacies near ${location}`);
      
      const medicineText = medicineInfo.type === 'single' 
        ? ` You can also buy ${medicineInfo.items[0].name} online from Lilly Direct.`
        : ' You can also browse and buy medicines online from Lilly Direct.';
      
      return {
        content: [{ 
          type: 'text' as const, 
          text: `Found ${pharmacies.length} pharmacies near ${displayName.split(',').slice(0, 2).join(', ')}.${medicineText}` 
        }],
        structuredContent: {
          pharmacies: pharmacies,
          userLocation: {
            lat: userLat,
            lng: userLng,
            displayName: displayName
          },
          searchLocation: location,
          pharmacyCount: pharmacies.length,
          lillyDirect: medicineInfo
        }
      };
      
    } catch (error: any) {
      console.error('Failed to find pharmacies:', error.message);
      
      if (error.name === 'AbortError') {
        return {
          content: [{ type: 'text' as const, text: 'Search timed out. Please try again.' }],
          structuredContent: { 
            error: 'Search timed out. Please try again.',
            pharmacies: [],
            userLocation: null,
            lillyDirect: medicineInfo
          }
        };
      }
      
      return {
        content: [{ type: 'text' as const, text: `Error searching for pharmacies: ${error.message}` }],
        structuredContent: { 
          error: error.message,
          pharmacies: [],
          userLocation: null,
          lillyDirect: medicineInfo
        }
      };
    }
  }
);

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
      
      const profileResponse = await fetch(`${capiGatewayUrl}/v1/userAggregate`, {
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
        products: ['Mounjaro® (tirzepatide)', 'Zepbound® (tirzepatide)']
      },
      _meta: {
        'openai/dynamicContent': dynamicResource
      }
    };
  }
);

// ==================== HTTP ENDPOINTS ====================

/**
 * Health Check Endpoint (with Redis status)
 */
app.get('/health', async (_req: Request, res: Response) => {
  const redisHealthy = await sessionManager.isHealthy();
  const sessionCount = await sessionManager.getActiveSessionCount();
  
  res.json({
    status: redisHealthy ? 'healthy' : 'unhealthy',
    redis: redisHealthy,
    activeSessions: sessionCount,
    timestamp: new Date().toISOString()
  });
});

/**
 * OAuth Protected Resource Metadata Endpoint
 * Required by ChatGPT Apps SDK for OAuth discovery.
 * Advertises this server's resource URL and supported authorization servers.
 * Must match Auth0 API Identifier exactly.
 */
app.get('/.well-known/oauth-protected-resource', (req, res) => {
  const issuerURL = process.env.LILLY_ISSUER_BASE_URL;
  const audience = process.env.LILLY_AUDIENCE; // Use audience as resource URL
  
  if (!issuerURL || !audience) {
    return res.status(503).json({
      error: 'server_misconfig',
      message: 'Set AUTH0_ISSUER_BASE_URL and AUTH0_AUDIENCE env vars'
    });
  }
  
  console.log('📋 PRM endpoint called - advertising resource:', audience);
  
  res.json({
    resource: audience, // MUST match the API Identifier in Auth0 EXACTLY
    authorization_servers: [issuerURL],
    scopes_supported: ['openid', 'profile'],
    bearer_methods_supported: ['header']
  });
});

/**
 * Token Storage Middleware (Redis Edition)
 * 
 * Process for each request:
 * 1. Extract JWT token from Authorization header
 * 2. Decode token to get session ID (sub claim)
 * 3. Get/create user session in Redis
 * 4. Set request context for this user
 * 5. Fetch brand and LC3 data if token changed
 * 6. Process continues to tool handler
 * 7. Clear context after response
 */
async function verifyToken(req: Request, res: Response, next: any) {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Incoming Request from ChatGPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  // console.log('🔍 Request Headers:');
  // console.log(JSON.stringify(req.headers, null, 2));
  // console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('⚠️  No Authorization header found');
    return next();
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || token === authHeader) {
    console.log('⚠️  Invalid token format in Authorization header');
    return next();
  }
try {
    // Get or create session in Redis
    const { sessionId, session } = await sessionManager.getSession(token);
    
    console.log(`👤 User Session ID: ${sessionId}`);
    
    // Set request context for this user
    setRequestContext(sessionId, token);
    
    // Check if token changed (new login or token refresh)
    const tokenChanged = token !== session.accessToken;
    
    console.log(`🔑 Token received: ${token.substring(0, 20)}...`);
    console.log(`🔄 Token changed: ${tokenChanged}`);
   
    if (tokenChanged) {
      console.log(`✅ Token stored in Redis for session ${sessionId}`);
      
      // Update access token in session
      await sessionManager.updateSession(sessionId, {
        accessToken: token
      });
      
      // Fetch user-specific data in background (don't block request)
      Promise.all([
        fetchAndSetBrand(sessionId, token),
        fetchAndSetLc3JwtAndId(sessionId, token)
      ]).catch(error => {
        console.error('Background fetch error:', error);
      });
    }
    
    // Log session count periodically for monitoring
    if (Math.random() < 0.01) { // 1% of requests
      sessionManager.getActiveSessionCount().then(count => {
        console.log(`📊 Active sessions in Redis: ${count}`);
      });
    }
    
    // Attach cleanup to response finish event
    res.on('finish', () => {
      clearRequestContext();
    });

    return next();
  } catch (error) {
    console.error('Session management error:', error);
    clearRequestContext();
    return res.status(500).json({ error: 'Session management failed' });
  }
}

/**
 * Fetches user app settings and updates Redis
 * 
 * @param sessionId - User's session ID
 * @param token - User's access token
 */
async function fetchAndSetBrand(sessionId: string, token: string): Promise<void> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${capiGatewayUrl}/v1/appSettings`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch app settings for ${sessionId}:`, response.status);
      return;
    }
    
    const data = await response.json();
    const settings = data.settings || [];
    
    if (settings.length > 0 && settings[0].key) {
      console.log(`✅ Settings found for ${sessionId} - User is already registered in LC3`);
      console.log(`   📋 Settings count: ${settings.length}`);
      
      const brandValue = settings[0].key;
      
      // Get official brand name using mapping
      const officialName = await getOfficialBrandName(brandValue);
      
      let emailValue = null;
      let savingsCardEnrolledYear = null;
      if (settings[0].value) {
        try {
          const settingsValue = JSON.parse(settings[0].value);
          emailValue = settingsValue.originalEmailId || null;
          
          // Extract savings card enrolled year
          if (settingsValue.savingsCardEnrolledYear) {
            try {
              const enrolledDate = new Date(settingsValue.savingsCardEnrolledYear);
              savingsCardEnrolledYear = enrolledDate.getFullYear().toString();
              console.log(`📅 Extracted savingsCardEnrolledYear: ${savingsCardEnrolledYear} from ${settingsValue.savingsCardEnrolledYear}`);
            } catch (dateError) {
              console.error('Failed to parse savingsCardEnrolledYear date:', settingsValue.savingsCardEnrolledYear, dateError);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse settings value:', parseError);
        }
      }

      // Update session in Redis
      await sessionManager.updateSession(sessionId, {
        brand: brandValue,
        officialBrandName: officialName,
        emailId: emailValue,
        savingProgramEnrolledYear: savingsCardEnrolledYear
      });
      
      console.log(`✅ Brand data saved to Redis for ${sessionId}`);
      console.log(`   📝 Brand: ${brandValue}`);
      console.log(`   📝 Official Brand Name: ${officialName}`);
      console.log(`   📝 Email ID: ${emailValue || 'null'}`);
      console.log(`   📝 Savings Card Enrolled Year: ${savingsCardEnrolledYear || 'null'}`);
      console.log(`   📝 Raw settings data:`, JSON.stringify(settings[0], null, 2));
    }
  } catch (error: any) {
    console.error(`Error fetching brand for ${sessionId}:`, error.message);
  }
}

/**
 * Fetches LC3 JWT and updates Redis
 * 
 * @param sessionId - User's session ID
 * @param token - User's access token
 */
async function fetchAndSetLc3JwtAndId(sessionId: string, token: string): Promise<void> {
  try {
    // Get session to read brand value
    const { session } = await sessionManager.getSession(token);
    
    if (!session.brand) {
      console.log(`No brand available for LC3 JWT fetch (session: ${sessionId})`);
      return;
    }
    
    const brandName = session.brand;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(`${lc3GatewayUrl}/v1/authorize`, {
      method: 'POST',
      headers: {
        'identity-provider': LC3_IDENTITY_PROVIDER,
        'cc-app-device-os-version': LC3_DEVICE_OS_VERSION,
        'cc-app-device': LC3_DEVICE,
        'cc-app-device-manufacturer': LC3_DEVICE_MANUFACTURER,
        'x-csp-dhisp-trackingid': randomUUID(),
        'brandname': brandName,
        'x-csp-dhisp-source': LC3_APP_NAME,
        'cc-app-instance-id': randomUUID(),
        'cc-app-name': LC3_APP_NAME,
        'cc-app-version': LC3_APP_VERSION,
        'cc-app-device-os': LC3_DEVICE_OS,
        'Authorization': `Bearer ${token}`
      },
      body: '',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.error(`Failed to fetch LC3 JWT for ${sessionId}:`, response.status);
      return;
    }
    
    const data = await response.json();
    
    if (data.jwt) {
      const lc3JwtToken = data.jwt;
      
      try {
        const patientId = extractPatientId(lc3JwtToken);
        
        // Update session in Redis
        await sessionManager.updateSession(sessionId, {
          lc3Jwt: lc3JwtToken,
          lc3Id: patientId
        });
        
        console.log(`✅ LC3 data saved to Redis for ${sessionId}`);
        console.log(`   📝 LC3 Patient ID: ${patientId}`);
        console.log(`   📝 LC3 JWT (first 50 chars): ${lc3JwtToken.substring(0, 50)}...`);
        console.log(`   📝 Brand used for LC3 request: ${brandName}`);
      } catch (error: any) {
        console.error('Error extracting patient ID:', error.message);
      }
    }
  } catch (error: any) {
    console.error(`Error fetching LC3 JWT for ${sessionId}:`, error.message);
  }
}

// Remove the old getBrandAndJwt function - no longer needed


/**
 * MCP Protocol Endpoint
 * Main endpoint for Model Context Protocol communication with ChatGPT.
 * Handles tool invocations, resource requests, and prompt interactions.
 * Uses verifyToken middleware to extract and store OAuth tokens.
 */
app.all('/mcp', express.json(), verifyToken, async (req: Request, res: Response) => {
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error('MCP request error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// ==================== SERVER STARTUP ====================

/**
 * Starts the MCP server and HTTP listener.
 * Connects MCP server to HTTP transport and binds to configured port.
 */
async function startServer() {
  try {
    await server.connect(transport);
    console.log('✅ MCP server connected to transport');
    
    // Start HTTP server
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Medicine Carousel MCP Server running on port ${PORT}`);
      console.log(`💊 Available medicines: ${AVAILABLE_MEDICINES.length} FDA-approved options`);
      console.log(` Ready for ChatGPT Apps integration with OAuth 2.1 + PKCE`);
    });
  } catch (error) {
    console.error('Failed to start MCP server:', error);
    process.exit(1);
  }
}

startServer();

export default app;