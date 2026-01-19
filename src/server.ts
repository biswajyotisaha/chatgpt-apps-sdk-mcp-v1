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
  'ui://widget/medicine-carousel-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://medicine-carousel.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/medicine-carousel-v1.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML(),
        _meta: {
          'openai/widgetDomain': 'https://medicine-carousel.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://logosandtypes.com'
            ]
          }
        }
      },
    ]
  })
);

// Single Medicine Resource  
server.registerResource(
  'single-medicine',
  'ui://widget/single-medicine-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://single-medicine.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/single-medicine-v1.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML([AVAILABLE_MEDICINES[0]]),
        _meta: {
          'openai/widgetDomain': 'https://single-medicine.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://logosandtypes.com'
            ]
          }
        }
      },
    ]
  })
);

server.registerResource(
  'user-profile-dynamic',
  'ui://widget/user-profile-dynamic-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://user-profile.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/user-profile-dynamic-v1.html',
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
</html>`,
        _meta: {
          'openai/widgetDomain': 'https://user-profile.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org'
            ]
          }
        }
      },
    ]
  })
);

server.registerResource(
  'savings-card-dynamic',
  'ui://widget/savings-card-dynamic-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://savings-card.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => {
    
    return {
      contents: [
        {
          uri: 'ui://widget/savings-card-dynamic-v1.html',
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
      const expirationYear = out.expirationYear || new Date().getFullYear() + 1;

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
          Offer good until <strong>12/31/\${out.expirationYear || new Date().getFullYear() + 1}</strong> or for up to 24 months from patient qualification into the program, whichever comes first.
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
</html>`,
          _meta: {
            'openai/widgetDomain': 'https://savings-card.onrender.com',
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [
                'https://upload.wikimedia.org',
                'https://logosandtypes.com'
              ]
            }
          }
        },
      ]
    };
  }
);

<<<<<<< Updated upstream
=======
// LC3 Registration Form Resource
server.registerResource(
  'registration-form',
  'ui://widget/registration-form-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://lc3-registration.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/registration-form-v1.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>LC3 Registration</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --brand: #e81f26;
      --text: #1f2937;
      --muted: #6b7280;
      --border: #d1d5db;
      --focus: #3b82f6;
      --shadow: 0 8px 24px rgba(0,0,0,.08);
      --radius: 20px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      display: grid;
      place-items: center;
      min-height: 100svh;
      padding: 24px;
    }

    .container {
      max-width: 480px;
      width: 100%;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 32px;
    }

    .header {
      text-align: center;
      margin-bottom: 28px;
    }

    .logo {
      width: 100px;
      height: auto;
      margin-bottom: 16px;
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 14px;
      color: var(--muted);
      line-height: 1.5;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text);
      margin-bottom: 6px;
    }

    .input, .select {
      width: 100%;
      padding: 12px 14px;
      font-size: 16px;
      border: 1px solid var(--border);
      border-radius: 10px;
      background: white;
      color: var(--text);
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .input:focus, .select:focus {
      outline: none;
      border-color: var(--focus);
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .input::placeholder {
      color: var(--muted);
    }

    .row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .submit-btn {
      width: 100%;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      color: white;
      background: var(--brand);
      border: none;
      border-radius: 9999px;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 24px;
    }

    .submit-btn:hover {
      background: #c91b22;
    }

    .submit-btn:active {
      transform: scale(0.98);
    }

    .submit-btn:disabled {
      background: var(--muted);
      cursor: not-allowed;
    }

    .terms {
      font-size: 12px;
      color: var(--muted);
      text-align: center;
      margin-top: 20px;
      line-height: 1.6;
    }

    .terms a {
      color: var(--brand);
      text-decoration: none;
    }

    .terms a:hover {
      text-decoration: underline;
    }

    .success-message {
      text-align: center;
      padding: 40px 20px;
    }

    .success-icon {
      width: 64px;
      height: 64px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .success-icon svg {
      width: 32px;
      height: 32px;
      fill: white;
    }

    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 14px;
      margin-bottom: 20px;
      display: none;
    }

    .hidden { display: none; }

    @media (max-width: 480px) {
      .row { grid-template-columns: 1fr; }
      .card { padding: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div id="form-view">
        <div class="header">
          <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly" class="logo" />
          <h1 class="title">Complete Your Registration</h1>
          <p class="subtitle">Join Lilly Care Connect to access savings programs, personalized support, and medication resources.</p>
        </div>

        <div id="error-box" class="error-message"></div>

        <form id="registration-form">
          <div class="row">
            <div class="form-group">
              <label class="label" for="firstName">First Name *</label>
              <input type="text" id="firstName" name="firstName" class="input" placeholder="John" required />
            </div>
            <div class="form-group">
              <label class="label" for="lastName">Last Name *</label>
              <input type="text" id="lastName" name="lastName" class="input" placeholder="Doe" required />
            </div>
          </div>

          <div class="form-group">
            <label class="label" for="email">Email Address *</label>
            <input type="email" id="email" name="email" class="input" placeholder="john.doe@example.com" required />
          </div>

          <div class="form-group">
            <label class="label" for="dateOfBirth">Date of Birth *</label>
            <input type="date" id="dateOfBirth" name="dateOfBirth" class="input" required />
          </div>

          <div class="form-group">
            <label class="label" for="brand">Select Your Medication *</label>
            <select id="brand" name="brand" class="select" required>
              <option value="">Choose a medication...</option>
              <option value="zepbound">Zepbound</option>
              <option value="mounjaro">Mounjaro</option>
              <option value="trulicity">Trulicity</option>
              <option value="taltz">Taltz</option>
              <option value="jardiance">Jardiance</option>
              <option value="emgality">Emgality</option>
            </select>
          </div>

          <button type="submit" class="submit-btn" id="submit-btn">
            <span>Register Now</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
              <path d="m221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
            </svg>
          </button>
        </form>

        <p class="terms">
          By registering, you agree to our <a href="https://www.lilly.com/privacy" target="_blank">Privacy Policy</a> 
          and <a href="https://www.lilly.com/terms" target="_blank">Terms of Service</a>.
        </p>
      </div>

      <div id="success-view" class="hidden">
        <div class="success-message">
          <div class="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
              <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
            </svg>
          </div>
          <h2 class="title">Registration Complete!</h2>
          <p class="subtitle">Welcome to Lilly Care Connect. You can now access savings programs, track your medications, and get personalized support.</p>
        </div>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('registration-form');
    const formView = document.getElementById('form-view');
    const successView = document.getElementById('success-view');
    const errorBox = document.getElementById('error-box');
    const submitBtn = document.getElementById('submit-btn');

    // Check for pre-filled data from tool output
    function prefillIfAvailable() {
      const out = window.openai?.toolOutput || {};
      if (out.prefill) {
        if (out.prefill.firstName) document.getElementById('firstName').value = out.prefill.firstName;
        if (out.prefill.lastName) document.getElementById('lastName').value = out.prefill.lastName;
        if (out.prefill.email) document.getElementById('email').value = out.prefill.email;
      }
    }

    // Show success view if registration completed
    function checkSuccess() {
      const out = window.openai?.toolOutput || {};
      if (out.registrationSuccess) {
        formView.classList.add('hidden');
        successView.classList.remove('hidden');
      }
    }

    prefillIfAvailable();
    checkSuccess();
    window.addEventListener('openai:set_globals', () => { prefillIfAvailable(); checkSuccess(); });
    window.addEventListener('openai:tool_response', () => { prefillIfAvailable(); checkSuccess(); });

    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        email: document.getElementById('email').value.trim(),
        dateOfBirth: document.getElementById('dateOfBirth').value,
        brand: document.getElementById('brand').value
      };

      // Validate
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.dateOfBirth || !formData.brand) {
        errorBox.textContent = 'Please fill in all required fields.';
        errorBox.style.display = 'block';
        return;
      }

      // Email validation
      const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errorBox.textContent = 'Please enter a valid email address.';
        errorBox.style.display = 'block';
        return;
      }

      // Age validation (must be 18+)
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        errorBox.textContent = 'You must be 18 years or older to register.';
        errorBox.style.display = 'block';
        return;
      }

      errorBox.style.display = 'none';
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span>Registering...</span>';

      // Send form data to ChatGPT via widget state
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          action: 'register',
          formData: formData
        });
      }

      // Simulate success for demo (actual submission handled by MCP tool)
      setTimeout(() => {
        formView.classList.add('hidden');
        successView.classList.remove('hidden');
      }, 1500);
    });

    console.log('LC3 Registration form loaded');
  </script>
</body>
</html>`,
        _meta: {
          'openai/widgetDomain': 'https://lc3-registration.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org'
            ]
          }
        }
      }
    ]
  })
);

// Injection Pen Instructions Resource
server.registerResource(
  'injection-instructions',
  'ui://widget/injection-instructions-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://injection-instructions.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://uspl.lilly.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/injection-instructions-v1.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Injection Pen Instructions</title>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --brand: #e81f26;
      --text: #1f2937;
      --muted: #6b7280;
      --warning-bg: #fef3c7;
      --warning-border: #f59e0b;
      --warning-text: #92400e;
      --info-bg: #dbeafe;
      --info-border: #3b82f6;
      --info-text: #1e40af;
      --success: #10b981;
      --shadow: 0 8px 24px rgba(0,0,0,.08);
      --radius: 16px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100svh;
      padding: 16px;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    .disclaimer {
      background: var(--info-bg);
      border: 1px solid var(--info-border);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      font-size: 13px;
      color: var(--info-text);
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .disclaimer-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
    }

    .card {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #e81f26 0%, #c41922 100%);
      color: white;
      padding: 20px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .medicine-logo {
      height: 32px;
      width: auto;
    }

    .header-title {
      font-size: 18px;
      font-weight: 600;
    }

    .step-indicator {
      background: rgba(255,255,255,0.2);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
    }

    .content {
      padding: 24px;
    }

    .step-title {
      font-size: 20px;
      font-weight: 700;
      color: var(--text);
      margin-bottom: 16px;
    }

    .step-visual {
      width: 100%;
      height: 200px;
      background: #f3f4f6;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 20px;
      overflow: hidden;
    }

    .step-visual img {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .step-visual video {
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }

    .step-description {
      font-size: 16px;
      line-height: 1.6;
      color: var(--text);
      margin-bottom: 16px;
    }

    .warning-box {
      background: var(--warning-bg);
      border: 1px solid var(--warning-border);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .warning-icon {
      flex-shrink: 0;
      width: 20px;
      height: 20px;
      color: var(--warning-border);
    }

    .warning-text {
      font-size: 14px;
      color: var(--warning-text);
      line-height: 1.5;
    }

    .navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      background: #fafafa;
    }

    .nav-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 9999px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .nav-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-back {
      background: #e5e7eb;
      color: var(--text);
    }

    .btn-back:hover:not(:disabled) {
      background: #d1d5db;
    }

    .btn-next {
      background: var(--brand);
      color: white;
    }

    .btn-next:hover:not(:disabled) {
      background: #c41922;
    }

    .progress-bar {
      height: 4px;
      background: #e5e7eb;
      border-radius: 2px;
      overflow: hidden;
      margin: 0 24px 0 24px;
    }

    .progress-fill {
      height: 100%;
      background: var(--brand);
      transition: width 0.3s ease;
    }

    .video-section {
      padding: 20px 24px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
    }

    .video-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s;
    }

    .video-btn:hover {
      background: #e5e7eb;
    }

    .video-modal {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .video-modal.active {
      display: flex;
    }

    .video-container {
      max-width: 800px;
      width: 100%;
      background: black;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .video-close {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 36px;
      height: 36px;
      background: rgba(255,255,255,0.9);
      border: none;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10;
    }

    .complete-message {
      text-align: center;
      padding: 40px 24px;
    }

    .complete-icon {
      width: 64px;
      height: 64px;
      background: var(--success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
    }

    .complete-icon svg {
      width: 32px;
      height: 32px;
      fill: white;
    }

    .complete-title {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
    }

    .complete-text {
      font-size: 15px;
      color: var(--muted);
      line-height: 1.6;
    }

    .hidden { display: none !important; }

    @media (max-width: 480px) {
      .navigation { flex-direction: column; gap: 12px; }
      .nav-btn { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="disclaimer">
      <svg class="disclaimer-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>These are official manufacturer instructions and do not replace guidance from your healthcare provider. Always consult your doctor or pharmacist with questions.</span>
    </div>

    <div class="card">
      <div class="header">
        <div class="header-left">
          <span class="header-title" id="medicine-name">Zepbound® Injection Pen</span>
        </div>
        <span class="step-indicator" id="step-indicator">Step 1 of 6</span>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 16.66%"></div>
      </div>

      <div id="step-content" class="content">
        <!-- Step content will be rendered here -->
      </div>

      <div id="navigation" class="navigation">
        <button class="nav-btn btn-back" id="btn-back" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,128a8,8,0,0,1-8,8H59.31l58.35,58.34a8,8,0,0,1-11.32,11.32l-72-72a8,8,0,0,1,0-11.32l72-72a8,8,0,0,1,11.32,11.32L59.31,120H216A8,8,0,0,1,224,128Z"/>
          </svg>
          Back
        </button>
        <button class="nav-btn btn-next" id="btn-next">
          Next
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
            <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"/>
          </svg>
        </button>
      </div>

      <div class="video-section">
        <button class="video-btn" id="watch-video-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
            <path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/>
          </svg>
          Watch Training Video
        </button>
      </div>
    </div>
  </div>

  <div class="video-modal" id="video-modal">
    <div class="video-container">
      <button class="video-close" id="video-close">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"/>
        </svg>
      </button>
      <video id="training-video" controls width="100%">
        <source src="" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </div>

  <script>
    // Injection steps data - will be populated from tool output
    const defaultSteps = [
      {
        title: "Check Your Pen",
        description: "Before using your Zepbound pen, check the expiration date on the label. Do not use the pen if it has expired. Look at the medicine through the window - it should be clear and colorless to slightly yellow. Do not use if it looks cloudy, discolored, or has particles.",
        warning: "Do not use the pen if it has been frozen or left in direct sunlight. Store in the refrigerator at 36°F to 46°F (2°C to 8°C).",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      },
      {
        title: "Choose Your Injection Site",
        description: "You can inject Zepbound into your stomach (abdomen), thigh, or upper arm. Choose a spot that is at least 2 inches away from your belly button. Rotate your injection site each week to avoid skin problems.",
        warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      },
      {
        title: "Prepare the Pen",
        description: "Pull off the gray base cap. You will see the needle. Do not touch the needle or let it touch any surface. Do not put the cap back on - you are now ready to inject.",
        warning: "Use the pen only once. Each pen contains one dose. Do not try to reuse or refill the pen.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      },
      {
        title: "Inject Your Dose",
        description: "Place the clear base flat against your skin at the injection site. Unlock by turning the lock ring. Press and hold the purple injection button. You will hear a loud click when the injection starts. Keep holding the button down until you hear a second click (about 5-10 seconds).",
        warning: "Keep the pen pressed firmly against your skin during the entire injection. Do not move the pen until the second click.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      },
      {
        title: "Remove and Check",
        description: "After the second click, lift the pen straight up from your skin. Look at the pen - the gray plunger should be visible in the window, confirming you received your full dose. A small drop of blood at the injection site is normal.",
        warning: "If the gray plunger is not visible, you may not have received your full dose. Contact your healthcare provider.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      },
      {
        title: "Dispose of the Pen",
        description: "Put the used pen in an FDA-cleared sharps disposal container right away after use. Do not throw the pen in your household trash. When your sharps container is almost full, follow your community guidelines for proper disposal.",
        warning: "Keep the sharps container out of reach of children. Do not recycle the pen or sharps container.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
      }
    ];

    let currentStep = 0;
    let steps = defaultSteps;
    let videoUrl = "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4";

    // DOM elements
    const stepContent = document.getElementById('step-content');
    const stepIndicator = document.getElementById('step-indicator');
    const progressFill = document.getElementById('progress-fill');
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const medicineName = document.getElementById('medicine-name');
    const videoModal = document.getElementById('video-modal');
    const trainingVideo = document.getElementById('training-video');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const videoClose = document.getElementById('video-close');
    const navigation = document.getElementById('navigation');

    function renderStep() {
      if (currentStep >= steps.length) {
        // Show completion message
        stepContent.innerHTML = \`
          <div class="complete-message">
            <div class="complete-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
                <path d="M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z"/>
              </svg>
            </div>
            <h2 class="complete-title">You're All Set!</h2>
            <p class="complete-text">You've reviewed all the injection steps. Remember to always follow your healthcare provider's instructions and refer to the official prescribing information if you have questions.</p>
          </div>
        \`;
        stepIndicator.textContent = 'Complete';
        progressFill.style.width = '100%';
        navigation.classList.add('hidden');
        return;
      }

      const step = steps[currentStep];
      
      stepContent.innerHTML = \`
        <h2 class="step-title">\${step.title}</h2>
        <div class="step-visual">
          <img src="\${step.image}" alt="\${step.title}" onerror="this.parentElement.innerHTML='<span style=\\"color:#9ca3af\\">Visual Guide</span>'" />
        </div>
        <p class="step-description">\${step.description}</p>
        \${step.warning ? \`
          <div class="warning-box">
            <svg class="warning-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span class="warning-text">\${step.warning}</span>
          </div>
        \` : ''}
      \`;

      // Update indicators
      stepIndicator.textContent = \`Step \${currentStep + 1} of \${steps.length}\`;
      progressFill.style.width = \`\${((currentStep + 1) / steps.length) * 100}%\`;

      // Update buttons
      btnBack.disabled = currentStep === 0;
      btnNext.textContent = currentStep === steps.length - 1 ? 'Finish' : 'Next';
      navigation.classList.remove('hidden');
    }

    // Event listeners
    btnBack.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        renderStep();
      }
    });

    btnNext.addEventListener('click', () => {
      currentStep++;
      renderStep();
    });

    watchVideoBtn.addEventListener('click', () => {
      trainingVideo.src = videoUrl;
      videoModal.classList.add('active');
      trainingVideo.play();
    });

    videoClose.addEventListener('click', () => {
      trainingVideo.pause();
      videoModal.classList.remove('active');
    });

    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        trainingVideo.pause();
        videoModal.classList.remove('active');
      }
    });

    // Load data from tool output if available
    function loadFromToolOutput() {
      const out = window.openai?.toolOutput || {};
      if (out.steps && out.steps.length > 0) {
        steps = out.steps;
      }
      if (out.videoUrl) {
        videoUrl = out.videoUrl;
      }
      if (out.medicineName) {
        medicineName.textContent = out.medicineName + ' Injection Pen';
      }
      renderStep();
    }

    loadFromToolOutput();
    window.addEventListener('openai:set_globals', loadFromToolOutput);
    window.addEventListener('openai:tool_response', loadFromToolOutput);

    console.log('Injection instructions widget loaded');
  </script>
</body>
</html>`,
        _meta: {
          'openai/widgetDomain': 'https://injection-instructions.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://delivery-p137454-e1438138.adobeaemcloud.com',
              'https://uspl.lilly.com'
            ]
          }
        }
      }
    ]
  })
);

>>>>>>> Stashed changes

// ==================== TOOLS ====================

/**
 * Tool: Show Injection Pen Instructions
 * Displays step-by-step injection instructions for medication pens.
 * Shows one step at a time with visuals, safety warnings, and navigation.
 */
server.registerTool(
  'show-injection-instructions',
  {
    title: 'Show Injection Pen Instructions',
    description: 'Display step-by-step injection instructions for medication pens like Zepbound, Mounjaro, or Trulicity. Shows guided steps with visuals, safety warnings, and a training video.',
    _meta: {
      'openai/outputTemplate': 'ui://widget/injection-instructions-v1.html',
      'openai/toolInvocation/invoking': 'Loading injection instructions...',
      'openai/toolInvocation/invoked': 'Injection instructions ready'
    },
    inputSchema: {
      medicineName: z.string().optional().describe('Name of the medicine (e.g., Zepbound, Mounjaro, Trulicity). Defaults to Zepbound if not specified.')
    } as any
  },
  async (args: any) => {
    const medicineName = args.medicineName?.toLowerCase() || 'zepbound';
    
    // Medicine-specific data
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
            title: "Check Your Pen",
            description: "Before using your Zepbound pen, check the expiration date on the label. Do not use the pen if it has expired. Look at the medicine through the window - it should be clear and colorless to slightly yellow. Do not use if it looks cloudy, discolored, or has particles.",
            warning: "Do not use the pen if it has been frozen or left in direct sunlight. Store in the refrigerator at 36°F to 46°F (2°C to 8°C).",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Choose Your Injection Site",
            description: "You can inject Zepbound into your stomach (abdomen), thigh, or upper arm. Choose a spot that is at least 2 inches away from your belly button. Rotate your injection site each week to avoid skin problems.",
            warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Prepare the Pen",
            description: "Pull off the gray base cap. You will see the needle. Do not touch the needle or let it touch any surface. Do not put the cap back on - you are now ready to inject.",
            warning: "Use the pen only once. Each pen contains one dose. Do not try to reuse or refill the pen.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Inject Your Dose",
            description: "Place the clear base flat against your skin at the injection site. Unlock by turning the lock ring. Press and hold the purple injection button. You will hear a loud click when the injection starts. Keep holding the button down until you hear a second click (about 5-10 seconds).",
            warning: "Keep the pen pressed firmly against your skin during the entire injection. Do not move the pen until the second click.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Remove and Check",
            description: "After the second click, lift the pen straight up from your skin. Look at the pen - the gray plunger should be visible in the window, confirming you received your full dose. A small drop of blood at the injection site is normal.",
            warning: "If the gray plunger is not visible, you may not have received your full dose. Contact your healthcare provider.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Dispose of the Pen",
            description: "Put the used pen in an FDA-cleared sharps disposal container right away after use. Do not throw the pen in your household trash. When your sharps container is almost full, follow your community guidelines for proper disposal.",
            warning: "Keep the sharps container out of reach of children. Do not recycle the pen or sharps container.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          }
        ]
      },
      'mounjaro': {
        name: 'Mounjaro®',
        videoUrl: 'https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4',
        instructionsUrl: 'https://uspl.lilly.com/mounjaro/mounjaro.html#ug',
        steps: [
          {
            title: "Check Your Pen",
            description: "Before using your Mounjaro pen, check the expiration date on the label. Do not use the pen if it has expired. Look at the medicine through the window - it should be clear and colorless to slightly yellow.",
            warning: "Do not use the pen if it has been frozen. Store in the refrigerator at 36°F to 46°F (2°C to 8°C).",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Choose Your Injection Site",
            description: "You can inject Mounjaro into your stomach (abdomen), thigh, or upper arm. Rotate your injection site each week.",
            warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Prepare and Inject",
            description: "Pull off the gray base cap. Place the clear base flat against your skin. Unlock and press the purple button. Hold until you hear the second click.",
            warning: "Keep the pen pressed firmly against your skin during the entire injection.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
          },
          {
            title: "Dispose Safely",
            description: "Put the used pen in a sharps disposal container. Do not throw in household trash.",
            warning: "Keep the sharps container out of reach of children.",
            image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:4cb54322-1b06-40ce-9d7f-3417d1fb259c"
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
      'openai/outputTemplate': 'ui://widget/medicine-carousel-v1.html',
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
      'openai/outputTemplate': 'ui://widget/single-medicine-v1.html',
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
      uri: 'ui://widget/single-medicine-v1.html',
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