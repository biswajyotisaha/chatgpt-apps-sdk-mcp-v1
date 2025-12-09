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
  extractPatientId
} from './userAuthenticationService.js';

// ==================== EXPRESS APP SETUP ====================

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const capiGatewayUrl = 'https://consumer-api.iv.apps.lilly.com';
const lc3GatewayUrl = 'https://lillytogether-gateway.iv.connectedcarecloud.com';
const dhispGatewayUrl = 'https://qa.ext-llydhisp.net/digh-lillytogether-test-xapi-v2';

// LC3 Gateway Headers
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

// ==================== HTML GENERATION ====================

/**
 * Generates HTML for the medicine carousel widget.
 * Creates a responsive carousel with navigation, FDA badges, and purchase links.
 * 
 * @param medicines - Array of medicine objects to display (defaults to all medicines)
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
function createMedicineCarouselHTML(medicines = AVAILABLE_MEDICINES): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Medicine Carousel</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      background: #f8fafc;
      padding: 20px;
    }
    .carousel-container { 
      width: 100%; 
      max-width: 600px;
      margin: 0 auto;
      overflow: hidden; 
      padding: 20px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .carousel-track { 
      display: flex; 
      gap: 0; 
      transition: transform 0.3s ease;
      width: ${medicines.length * 100}%;
    }
    .medicine-tile { 
      min-width: calc(100% / ${medicines.length});
      flex: 0 0 calc(100% / ${medicines.length});
      border: 1px solid #e5e7eb;
      border-radius: 24px;
      padding: 36px;
      background: white;
      display: flex;
      flex-direction: column;
      min-height: 500px;
      max-height: 540px;
    }
    .medicine-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .medicine-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .medicine-logo {
      width: 185px;
      height: auto;
    }
    .badge {
      display: flex;
      align-items: center;
      border: 1px solid #9ca3af;
      border-radius: 6px;
      padding: 8px 12px;
      width: 168px;
      font-size: 16px;
    }
    .badge-icon {
      width: 18px;
      height: 18px;
      margin-right: 8px;
    }
    .fda-text {
      font-style: italic;
      font-size: 10px;
      color: #6b7280;
      margin: 16px 0;
    }
    .product-image-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 180px;
      max-height: 220px;
      margin: 20px 0;
      overflow: hidden;
    }
    .product-image {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .cta-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: auto;
      padding-top: 20px;
      flex-shrink: 0;
    }
    .delivery-badge {
      display: inline-flex;
      align-items: center;
      border: 1px solid #9ca3af;
      border-radius: 6px;
      padding: 6px 10px;
      font-size: 16px;
    }
    .buy-button {
      background-color: rgb(255, 37, 27);
      color: white;
      border: none;
      border-radius: 9999px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 180px;
      cursor: pointer;
      transition: background-color 0.2s;
      gap: 8px;
    }
    .buy-button:hover {
      background-color: rgb(220, 30, 22);
    }
    .arrow-icon {
      width: 16px;
      height: 16px;
      fill: white;
    }
    .nav-button {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      background: rgba(255,255,255,0.9);
      border: none;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      cursor: pointer;
      font-size: 18px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10;
    }
    .nav-prev { left: 20px; }
    .nav-next { right: 20px; }
    .carousel-wrapper {
      position: relative;
    }
    .status {
      text-align: center;
      color: #374151;
      margin-bottom: 20px;
      font-weight: 500;
      font-size: 18px;
    }
    .auth-banner {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 12px;
      text-align: center;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
    }
    .auth-banner a {
      color: white;
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="carousel-container">
    <div class="auth-banner">
      🔐 <a href="/auth-status">Check your login status</a> for personalized medicine recommendations
    </div>
    <div class="status">💊 Available Medicines • ${medicines.length} FDA-Approved Options</div>
    <div class="carousel-wrapper">
      <div class="carousel-track" id="carousel-track">
        ${medicines.map(medicine => `
          <div class="medicine-tile">
            <div class="medicine-content">
              <div class="medicine-header">
                <div>
                  <img src="${medicine.logo}" alt="${medicine.name}" class="medicine-logo">
                </div>
                <div class="badge">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256" class="badge-icon">
                    <path d="M183.31,188l22.35-22.34a8,8,0,0,0-11.32-11.32L172,176.69l-41.15-41.16A52,52,0,0,0,124,32H72a8,8,0,0,0-8,8V192a8,8,0,0,0,16,0V136h28.69l52,52-22.35,22.34a8,8,0,0,0,11.32-11.32L172,199.31l22.34,22.35a8,8,0,0,0,11.32-11.32ZM80,48h44a36,36,0,0,1,0,72H80Z"></path>
                  </svg>
                  <span>FDA-approved</span>
                </div>
              </div>
              <div class="fda-text">FDA-approved</div>
              <div class="product-image-container">
                <img src="${medicine.image}" alt="${medicine.name}" class="product-image">
              </div>
            </div>
            <div class="cta-bar">
              <div class="delivery-badge">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256" class="badge-icon">
                  <path d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"></path>
                </svg>
                <span>Free delivery</span>
              </div>
              <a href="${medicine.buyLink}" target="_blank" class="buy-button">
                ${medicine.buyLinkText}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 256 256" class="arrow-icon">
                  <path d="m221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
                </svg>
              </a>
            </div>
          </div>
        `).join('')}
      </div>
      ${medicines.length > 1 ? `
        <button class="nav-button nav-prev" onclick="scrollCarousel(-1)">←</button>
        <button class="nav-button nav-next" onclick="scrollCarousel(1)">→</button>
      ` : ''}
    </div>
  </div>
  
  <script>
    let currentIndex = 0;
    const maxIndex = ${medicines.length - 1};
    const slideWidth = 100 / ${medicines.length};
    
    function scrollCarousel(direction) {
      if (${medicines.length} <= 1) return;
      
      currentIndex = Math.max(0, Math.min(maxIndex, currentIndex + direction));
      const track = document.getElementById('carousel-track');
      track.style.transform = 'translateX(-' + (currentIndex * slideWidth) + '%)';
      
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          currentIndex: currentIndex,
          viewMode: 'medicine-carousel',
          medicineCount: ${medicines.length}
        });
      }
    }
    
    console.log('Medicine carousel loaded with ${medicines.length} items');
  </script>
</body>
</html>`;
}

// ==================== UI RESOURCES ====================

// Medicine Carousel Resource (All medicines)
server.registerResource(
  'medicine-carousel',
  'ui://widget/medicine-carousel.html',
  {},
  async () => ({
    contents: [
      {
        uri: 'ui://widget/medicine-carousel.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML()
      },
    ],
  })
);

// Single Medicine Resource  
server.registerResource(
  'single-medicine',
  'ui://widget/single-medicine.html',
  {},
  async () => ({
    contents: [
      {
        uri: 'ui://widget/single-medicine.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML([AVAILABLE_MEDICINES[0]]) // Default to first medicine
      },
    ],
  })
);

server.registerResource(
  'user-profile-dynamic',
  'ui://widget/user-profile-dynamic.html',
  {},
  async () => ({
    contents: [
      {
        uri: 'ui://widget/user-profile-dynamic.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>User Profile</title>
  <style>
    :root{
      --bg:#f5f7fb;
      --card:#ffffff;
      --brand:#e81f26;
      --text:#1f2937;
      --muted:#6b7280;
      --shadow:0 8px 24px rgba(0,0,0,.08);
      --radius:20px;
    }

    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      background:var(--bg);
      color:var(--text);
      display:grid;
      place-items:center;
      min-height:100svh;
      padding:24px;
    }

    .wrap{max-width:820px;width:100%;display:flex;flex-direction:column;gap:18px}

    .card{
      position:relative;
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:28px;
      overflow:hidden;
    }

    .card-header{
      text-align:center;
      margin-bottom:32px;
    }

    .logo-lilly{
      width:120px;
      height:auto;
      margin:0 auto 16px;
      display:block;
    }

    .profile-subtitle{
      font-size:14px;
      color:var(--muted);
    }

    .grid{
      display:grid;
      grid-template-columns:1fr auto;
      row-gap:26px;
      column-gap:24px;
      align-items:center;
      font-size:18px;
    }

    .label{
      color:#111827;
      font-weight:600;
      letter-spacing:.02em;
    }

    .value{
      font-weight:500;
      text-align:right;
    }

    .value.empty{
      color:var(--muted);
      font-style:italic;
      font-weight:400;
    }

    @media (max-width:640px){
      .grid{font-size:16px;}
    }

    #skeleton { text-align: center; padding: 40px; color: var(--muted); }
  </style>
</head>
<body>
  <div id="skeleton" aria-busy="true">
    Loading user profile…
  </div>

  <div id="root" hidden></div>

  <script>
    const root = document.getElementById('root');
    const skeleton = document.getElementById('skeleton');

    function renderIfReady() {
      const out = window.openai?.toolOutput || {};
      const profile = out.profile || null;

      if (!profile) return;

      const givenName = profile.givenName || '';
      const familyName = profile.familyName || '';
      
      const email = profile.email || '';
      const phoneNumber = profile.phoneNumber || '';
      const dob = profile.dob || '';
      const gender = profile.gender || '';
      
      // Format address from primaryResidence object
      const residence = profile.primaryResidence;
      let address = '';
      if (residence && typeof residence === 'object') {
        const parts = [
          residence.address1,
          residence.address2,
          residence.city,
          residence.state,
          residence.zipCode
        ].filter(Boolean);
        address = parts.join(', ');
      }

      root.innerHTML = \`
  <main class="wrap" role="main" aria-label="User Profile">
    <section class="card" aria-label="Profile Information">
      <div class="card-header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly logo" class="logo-lilly" />
        <div class="profile-subtitle">Profile Information</div>
      </div>

      <div class="grid" role="list">
        <div class="label" role="listitem">First Name</div>
        <div class="value \${givenName ? '' : 'empty'}" aria-label="First Name value">\${givenName || 'Not provided'}</div>

        <div class="label" role="listitem">Last Name</div>
        <div class="value \${familyName ? '' : 'empty'}" aria-label="Last Name value">\${familyName || 'Not provided'}</div>

        <div class="label" role="listitem">Email</div>
        <div class="value \${email ? '' : 'empty'}" aria-label="Email value">\${email || 'Not provided'}</div>

        <div class="label" role="listitem">Phone</div>
        <div class="value \${phoneNumber ? '' : 'empty'}" aria-label="Phone value">\${phoneNumber || 'Not provided'}</div>

        <div class="label" role="listitem">Date of Birth</div>
        <div class="value \${dob ? '' : 'empty'}" aria-label="DOB value">\${dob || 'Not provided'}</div>

        <div class="label" role="listitem">Gender</div>
        <div class="value \${gender ? '' : 'empty'}" aria-label="Gender value">\${gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not provided'}</div>

        <div class="label" role="listitem">Address</div>
        <div class="value \${address ? '' : 'empty'}" aria-label="Address value" style="max-width:400px">\${address || 'Not provided'}</div>
      </div>
    </section>
  </main>\`;

      skeleton.hidden = true;
      root.hidden = false;
    }

    renderIfReady();
    window.addEventListener('openai:set_globals', renderIfReady);
    window.addEventListener('openai:tool_response', renderIfReady);
  </script>
</body>
</html>`
      },
    ],
  })
);

server.registerResource(
  'savings-card-dynamic',
  'ui://widget/savings-card-dynamic.html',
  {},
  async () => {
    // Calculate expiration year (current year + 1)
    const expirationYear = new Date().getFullYear() + 1;
    
    return {
      contents: [
        {
          uri: 'ui://widget/savings-card-dynamic.html',
          mimeType: 'text/html+skybridge',
          text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Lilly Savings Card</title>
  <style>
    :root{
      --bg:#f5f7fb;
      --card:#ffffff;
      --brand:#e81f26; /* Lilly red (approx) */
      --text:#1f2937;
      --muted:#6b7280;
      --accent:#0b5cab; /* blue accent for "EXPIRES" */
      --shadow:0 8px 24px rgba(0,0,0,.08);
      --radius:20px;
    }

    *{box-sizing:border-box}
    body{
      margin:0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      background:var(--bg);
      color:var(--text);
      display:grid;
      place-items:center;
      min-height:100svh;
      padding:24px;
    }

    .wrap{max-width:820px;width:100%;display:flex;flex-direction:column;gap:18px}

    /* Top card */
    .card{
      position:relative;
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:28px 28px 32px 28px;
      overflow:hidden;
    }
    .card::after{ /* angled light band */
      content:"";
      position:absolute;inset:-30% -40% auto auto;
      width:70%;height:170%;
      background:linear-gradient(180deg, rgba(0,0,0,0.03), rgba(0,0,0,0.06));
      transform:skewX(-18deg);
      border-radius:40px;
      pointer-events:none;
    }

    .card-header{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}

    .logo-lilly{
      width:76px;height:34px;object-fit:contain;flex:0 0 auto
    }

    .meta{ text-align:right }
    .meta small{color:var(--muted);text-transform:uppercase;letter-spacing:.12em;font-weight:700}
    .meta .number{font-size:28px;font-weight:700;margin-top:4px}

    .content{display:grid;grid-template-columns:120px 1fr;gap:18px;align-items:start;margin-top:22px}

    .logo-L{ /* big scripted L */
      width:120px;height:120px;object-fit:contain
    }

    .terms{line-height:1.6;font-size:16px}

    .expires{position:absolute;right:28px;top:96px;color:var(--accent);font-weight:800;letter-spacing:.08em}

    .footnote{ text-align:center; color:var(--muted); font-size:15px; padding:2px 6px }

    /* Bottom details panel */
    .panel{
      background:var(--card);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      padding:26px;
    }
    .grid{
      display:grid;
      grid-template-columns:1fr auto; /* label / value */
      row-gap:26px;
      column-gap:24px;
      align-items:center;
      font-size:22px;
    }
    .label{color:#111827;font-weight:600;letter-spacing:.02em}
    .value{font-weight:600;}

    @media (max-width:640px){
      .content{grid-template-columns:1fr;}
      .expires{position:static;margin-top:8px;text-align:right}
      .meta .number{font-size:22px}
      .grid{font-size:18px}
    }

    #skeleton { text-align: center; padding: 40px; color: var(--muted); }
  </style>
</head>
<body>
  <div id="skeleton" aria-busy="true">
    Loading savings card information…
  </div>

  <div id="root" hidden></div>

  <script>
    const root = document.getElementById('root');
    const skeleton = document.getElementById('skeleton');

    function renderIfReady() {
      const out = window.openai?.toolOutput || {};
      const copayCard = out.copayCard || null;

      if (!copayCard) return;

      const cardNumber = copayCard.copayCardNumber || 'N/A';
      const rxBIN = copayCard.RxBIN || 'N/A';
      const rxPCN = copayCard.RxPCN || 'N/A';
      const rxGroup = copayCard.RxGroup || 'N/A';

      root.innerHTML = \`
  <main class="wrap" role="main" aria-label="Lilly Savings Card">
    <!-- Savings Card -->
    <section class="card" aria-label="Savings Card">
      <div class="card-header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly logo" class="logo-lilly" />
        <div class="meta">
          <small>Savings Card #</small>
          <div class="number" aria-label="Card Number">\${cardNumber}</div>
        </div>
      </div>

      <div class="content">
        <img src="https://logosandtypes.com/wp-content/uploads/2025/04/Lilly-scaled.png" alt="Lilly L logo" class="logo-L" />
        <p class="terms">
          Offer good until <strong>12/31/${expirationYear}</strong> or for up to 24 months from patient qualification into the program, whichever comes first.
        </p>
      </div>

      <div class="expires">EXPIRES</div>
    </section>

    <p class="footnote">*Governmental beneficiaries excluded, terms and conditions apply.</p>

    <!-- Bottom info panel -->
    <section class="panel" aria-label="Pharmacy Processing Info">
      <div class="grid" role="list">
        <div class="label" role="listitem">RXBIN</div>
        <div class="value" aria-label="RXBIN value">\${rxBIN}</div>

        <div class="label" role="listitem">PCN</div>
        <div class="value" aria-label="PCN value">\${rxPCN}</div>

        <div class="label" role="listitem">GRP</div>
        <div class="value" aria-label="GRP value">\${rxGroup}</div>

        <div class="label" role="listitem">ID#</div>
        <div class="value" aria-label="ID Number">\${cardNumber}</div>
      </div>
    </section>
  </main>\`;

      skeleton.hidden = true;
      root.hidden = false;
    }

    renderIfReady();
    window.addEventListener('openai:set_globals', renderIfReady);
    window.addEventListener('openai:tool_response', renderIfReady);
  </script>
</body>
</html>`
        },
      ],
    };
  }
);


// ==================== TOOLS ====================

/**
 * Tool: Show All Medicines
 * Displays all available FDA-approved medicines in an interactive carousel.
 * No authentication required - public tool accessible to all users.
 */
server.registerTool(
  'show-all-medicines',
  {
    title: 'Show All Available Medicines',
    description: 'Display all available FDA-approved medicines in a carousel view',
    _meta: {
      'openai/outputTemplate': 'ui://widget/medicine-carousel.html',
      'openai/toolInvocation/invoking': 'Loading available medicines...',
      'openai/toolInvocation/invoked': 'Medicines carousel loaded successfully',
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
          text: `Displaying ${AVAILABLE_MEDICINES.length} FDA-approved medicines available for purchase.`
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
      'openai/outputTemplate': 'ui://widget/user-profile-dynamic.html',
      'openai/toolInvocation/invoking': 'Fetching user profile...',
      'openai/toolInvocation/invoked': 'User profile loaded successfully'
    },
    inputSchema: {}
  },
  async () => {
    const userToken = requireAccessToken();
    
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
      'openai/outputTemplate': 'ui://widget/savings-card-dynamic.html',
      'openai/toolInvocation/invoking': 'Fetching savings card information...',
      'openai/toolInvocation/invoked': 'Savings card loaded successfully'
    },
    inputSchema: {}
  },
  async () => {
    const userToken = requireAccessToken();
    
    // Fetch brand and LC3 JWT if not already loaded
    // await getBrandAndJwt(userToken);
    
    // const uid = requireLc3Id();
    // const email = requireEmailId();
    // const officialBrandName = requireOfficialBrandName();
    
    const uid = 'f765e766-0379-4344-a703-9383c4818174';
    const email = 'taltz1817@grr.la';
    const officialBrandName = 'Ixekizumab US';
    
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
      
      return {
        content: [{ 
          type: 'text', 
          text: `Savings card loaded: ${copayCard.copayCardNumber || 'No card number'}` 
        }],
        structuredContent: { copayCard: copayCard }
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
 * Tool: Show Single Medicine
 * Displays detailed information about a specific medicine by name.
 * Supports optional authentication for personalized experience.
 * Creates dynamic HTML resource with the selected medicine details.
 */
server.registerTool(
  'show-medicine',
  {
    title: 'Show Specific Medicine',
    description: 'Display information about a specific medicine',
    _meta: {
      'openai/outputTemplate': 'ui://widget/single-medicine.html',
      'openai/toolInvocation/invoking': 'Loading medicine information...',
      'openai/toolInvocation/invoked': 'Medicine information loaded successfully',
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

    // Update the single medicine resource with the selected medicine
    const singleMedicineHTML = createMedicineCarouselHTML([medicine]);
    
    // Create a dynamic resource
    const dynamicResource = {
      uri: 'ui://widget/single-medicine.html',
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
          text: `Displaying information for ${medicine.name} - FDA-approved medicine available for purchase.`
        }
      ],
      structuredContent: medicineData,
      _meta: {
        'openai/dynamicContent': dynamicResource
      }
    };
  }
);

// ==================== HTTP ENDPOINTS ====================

/**
 * Health Check Endpoint
 * Simple endpoint to verify server is running and responding.
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
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
 * Token Storage Middleware
 * Extracts OAuth token from Authorization header and stores it for tool use.
 * Non-blocking - allows all requests through, tools enforce auth as needed.
 */
async function verifyToken(req: Request, res: Response, next: any) {
  // Log all incoming request headers from ChatGPT
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📥 Incoming Request from ChatGPT');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 Request Headers:');
  console.log(JSON.stringify(req.headers, null, 2));
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    console.log('⚠️  No Authorization header found');
    setAccessToken(null);
    return next();
  }
  
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token || token === authHeader) {
    console.log('⚠️  Invalid token format in Authorization header');
    setAccessToken(null);
    return next();
  }
  
  // Check if access token value has changed
  const currentToken = getAccessToken();
  const tokenChanged = token !== currentToken;
  
  console.log(`🔑 Token received: ${token.substring(0, 20)}...`);
  console.log(`🔄 Token changed: ${tokenChanged}`);
 
  if (tokenChanged ) {
    // Store the access token
    setAccessToken(token);
    console.log('✅ Access token stored');
    
    // Fetches brand and LC3 JWT token and brand using the access token.
    await fetchAndSetBrand(token);
    // Whenever access token changes try to fetch LC3 JWT, this will replace the existing value
    await fetchAndSetLc3JwtAndId(token);
  }
  
  return next();
}

/**
 * Fetches brand and LC3 JWT token using the access token.
 */
async function getBrandAndJwt(token: string): Promise<void> {
  let needsLc3Jwt = false;
  let needsLc3Id = false;
  let needsBrand = false;
  
  try {
    requireLc3Jwt();
  } catch {
    needsLc3Jwt = true;
  }
  
  try {
    requireLc3Id();
  } catch {
    needsLc3Id = true;
  }
  
  try {
    requireBrand();
  } catch {
    needsBrand = true;
  }

  // Only call getBrandAndJwt if token changed or data is missing
  if (needsLc3Jwt || needsLc3Id || needsBrand) {
    // Fetch and set brand from app settings
  await fetchAndSetBrand(token);
  
  // Fetch and set LC3 JWT and LC3 ID
  await fetchAndSetLc3JwtAndId(token);
  }
}

/**
 * Fetches user app settings and extracts the brand.
 * Sets the brand value if found in settings.
 */
async function fetchAndSetBrand(token: string): Promise<void> {
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
      console.error('Failed to fetch app settings:', response.status);
      setBrand(null);
      return;
    }
    
    const data = await response.json();
    const settings = data.settings || [];
    
    // Extract brand and emailId from settings
    if (settings.length > 0 && settings[0].key) {
      const brandValue = settings[0].key;
      console.log(`Brand set to: ${brandValue}`);
      setBrand(brandValue);
      
      // Set official brand name using the mapping function
      const officialName = getOfficialBrandName(brandValue);
      console.log(`Official brand name set to: ${officialName}`);
      setOfficialBrandName(officialName);
      
      // Extract originalEmailId from the value field
      if (settings[0].value) {
        try {
          const settingsValue = JSON.parse(settings[0].value);
          const emailValue = settingsValue.originalEmailId || null;
          console.log(`Email ID set to: ${emailValue}`);
          setEmailId(emailValue);
        } catch (parseError) {
          console.error('Failed to parse settings value:', parseError);
          setEmailId(null);
        }
      } else {
        setEmailId(null);
      }
    } else {
      console.log('User not registered, no brand found');
      setBrand(null);
      setOfficialBrandName(null);
      setEmailId(null);
    }
  } catch (error: any) {
    console.error('Error fetching brand:', error.message);
    setBrand(null);
    setOfficialBrandName(null);
    setEmailId(null);
  }
}

/**
 * Fetches LC3 JWT token and extracts the patient ID.
 * Sets both lc3Jwt and lc3Id values.
 */
async function fetchAndSetLc3JwtAndId(token: string): Promise<void> {
  try {
    // Get the brand from stored variable (default to 'taltz' if not set)
    const brandName = requireBrand();
    
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
      console.error('Failed to fetch LC3 JWT:', response.status);
      setLc3Jwt(null);
      setLc3Id(null);
      return;
    }
    
    const data = await response.json();
    
    // Extract JWT from response
    if (data.jwt) {
      const lc3JwtToken = data.jwt;
      console.log('LC3 JWT token received');
      setLc3Jwt(lc3JwtToken);
      
      // Extract patient ID from the JWT
      try {
        const patientId = extractPatientId(lc3JwtToken);
        console.log(`LC3 ID set to: ${patientId}`);
        setLc3Id(patientId);
      } catch (error: any) {
        console.error('Error extracting patient ID from LC3 JWT:', error.message);
        setLc3Id(null);
      }
    } else {
      console.log('User not registered, no LC3 JWT found');
      setLc3Jwt(null);
      setLc3Id(null);
    }
  } catch (error: any) {
    console.error('Error fetching LC3 JWT:', error.message);
    setLc3Jwt(null);
    setLc3Id(null);
  }
}


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