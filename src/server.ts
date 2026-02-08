import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { AVAILABLE_MEDICINES, TROUBLESHOOTING_DATA, DEVICE_TROUBLESHOOTING_FLOWS } from './data.js';
import { MedicineData, TrainingVideoData, TroubleshootingData, DeviceTroubleshootingFlow } from './types.js';
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
                  <img src="${medicine.logo}" alt="${medicine.name}" class="medicine-logo" crossorigin="anonymous" referrerpolicy="no-referrer">
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
                <img src="${medicine.image}" alt="${medicine.name}" class="product-image" crossorigin="anonymous" referrerpolicy="no-referrer">
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

/**
 * Generates HTML for the troubleshooting widget.
 * Creates an interactive troubleshooting guide with common issues, side effects, and emergency contacts.
 * 
 * @param troubleshootingData - Troubleshooting data for the specific medicine
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
function createTroubleshootingWidgetHTML(troubleshootingData: TroubleshootingData): string {
  const severityColors = {
    mild: '#10b981',
    moderate: '#f59e0b', 
    severe: '#ef4444',
    emergency: '#dc2626'
  };

  const severityIcons = {
    mild: '💡',
    moderate: '⚠️',
    severe: '🚨',
    emergency: '🆘'
  };

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Troubleshooting Guide - ${troubleshootingData.medicineName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      background: #f8fafc;
      color: #1f2937;
      line-height: 1.6;
      padding: 20px;
    }
    
    .widget-container { 
      width: 100%; 
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .widget-header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .content-area {
      padding: 32px;
    }
    
    .tab-navigation {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    
    .tab-button {
      background: none;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
    }
    
    .tab-button.active {
      color: #dc2626;
      border-bottom-color: #dc2626;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .issue-card {
      background: #f9fafb;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
      border-left: 4px solid #10b981;
    }
    
    .issue-header {
      padding: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      font-weight: 600;
      font-size: 18px;
    }
    
    .issue-content {
      padding: 0 20px 20px;
      display: none;
    }
    
    .issue-content.expanded {
      display: block;
    }
    
    .solutions-list {
      list-style: none;
      margin: 16px 0;
    }
    
    .solutions-list li {
      background: white;
      margin-bottom: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 3px solid #10b981;
    }
    
    .emergency-contacts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    
    .contact-card {
      background: #f3f4f6;
      border-radius: 8px;
      padding: 16px;
      text-align: center;
    }
    
    .contact-card a {
      color: #dc2626;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <h1>🩺 Troubleshooting Guide</h1>
      <p>Get help with common issues for ${troubleshootingData.medicineName}</p>
    </div>
    
    <div class="content-area">
      <div class="tab-navigation">
        <button class="tab-button active" onclick="showTab('common-issues')">Common Issues</button>
        <button class="tab-button" onclick="showTab('side-effects')">Side Effects</button>
        <button class="tab-button" onclick="showTab('emergency')">Emergency</button>
      </div>
      
      <div id="common-issues" class="tab-content active">
        <h2 style="margin-bottom: 20px;">🔧 Common Issues & Solutions</h2>
        ${troubleshootingData.commonIssues.map((issue, index) => `
          <div class="issue-card">
            <div class="issue-header" onclick="toggleIssue(${index})">
              <span>💡</span>
              <span>${issue.issue}</span>
              <span style="margin-left: auto; background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px;">${issue.severity}</span>
            </div>
            <div class="issue-content" id="content-${index}">
              <h4>Solutions:</h4>
              <ul class="solutions-list">
                ${issue.solutions.map(solution => `<li>${solution}</li>`).join('')}
              </ul>
              <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 16px 0;">
                <h4 style="color: #92400e; margin-bottom: 8px;">⚠️ When to Seek Help:</h4>
                <p>${issue.whenToSeekHelp}</p>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div id="side-effects" class="tab-content">
        <h2 style="margin-bottom: 20px;">⚕️ Side Effects Management</h2>
        ${troubleshootingData.sideEffects.common.map((effect, index) => `
          <div class="issue-card">
            <div class="issue-header" onclick="toggleIssue('side-${index}')">
              <span>⚠️</span>
              <span>${effect.issue}</span>
            </div>
            <div class="issue-content" id="content-side-${index}">
              <ul class="solutions-list">
                ${effect.solutions.map(solution => `<li>${solution}</li>`).join('')}
              </ul>
            </div>
          </div>
        `).join('')}
      </div>
      
      <div id="emergency" class="tab-content">
        <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); color: white; padding: 20px; border-radius: 12px; text-align: center; margin-bottom: 24px;">
          <h3>🆘 Emergency Information</h3>
          <p>Keep these numbers accessible at all times</p>
        </div>
        
        <div class="emergency-contacts">
          <div class="contact-card">
            <h4>🚨 Medical Emergency</h4>
            <a href="tel:${troubleshootingData.emergencyContacts.medicalEmergency}">${troubleshootingData.emergencyContacts.medicalEmergency}</a>
          </div>
          
          <div class="contact-card">
            <h4>☎️ Lilly Support</h4>
            <a href="tel:${troubleshootingData.emergencyContacts.lillySupport}">${troubleshootingData.emergencyContacts.lillySupport}</a>
          </div>
          
          <div class="contact-card">
            <h4>☠️ Poison Control</h4>
            <a href="tel:${troubleshootingData.emergencyContacts.poison}">${troubleshootingData.emergencyContacts.poison}</a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
      });
      
      document.getElementById(tabId).classList.add('active');
      event.target.classList.add('active');
    }
    
    function toggleIssue(issueId) {
      const content = document.getElementById('content-' + issueId);
      const isExpanded = content.classList.contains('expanded');
      
      document.querySelectorAll('.issue-content.expanded').forEach(el => {
        el.classList.remove('expanded');
      });
      
      if (!isExpanded) {
        content.classList.add('expanded');
      }
    }
    
    console.log('Troubleshooting widget loaded for ${troubleshootingData.medicineName}');
  </script>
</body>
</html>`;
}

/**
 * Generates HTML for the interactive device troubleshooting widget.
 * Creates a step-by-step guided troubleshooting flow with Yes/No buttons and product quality complaint form.
 * 
 * @param troubleshootingFlow - Device troubleshooting flow data
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
function createInteractiveTroubleshootingWidgetHTML(troubleshootingFlow: DeviceTroubleshootingFlow): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Device Troubleshooting - ${troubleshootingFlow.medicineName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, sans-serif; 
      background: #f8fafc;
      color: #1f2937;
      line-height: 1.6;
      padding: 20px;
    }
    
    .widget-container { 
      width: 100%; 
      max-width: 700px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      overflow: hidden;
      min-height: 500px;
    }
    
    .widget-header {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .widget-header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .device-info {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 16px 0;
      justify-content: center;
    }
    
    .device-image {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 8px;
      background: rgba(255,255,255,0.1);
      padding: 8px;
    }
    
    .content-area {
      padding: 32px;
    }
    
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      margin-bottom: 24px;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      background: #dc2626;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .step-container {
      display: none;
    }
    
    .step-container.active {
      display: block;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateX(20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    .step-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }
    
    .step-number {
      width: 32px;
      height: 32px;
      background: #dc2626;
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 14px;
    }
    
    .step-title {
      font-size: 20px;
      font-weight: 600;
      color: #111827;
    }
    
    .step-description {
      font-size: 16px;
      color: #6b7280;
      margin-bottom: 20px;
    }
    
    .device-visual {
      background: transparent;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 20px 0;
      border: none;
    }
    
    .device-visual img {
      width: 280px;
      height: 280px;
      object-fit: contain;
      margin-bottom: 12px;
    }
    
    .safety-warning {
      background: #fef3c7;
      border: 2px solid #f59e0b;
      border-radius: 12px;
      padding: 16px;
      margin: 20px 0;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .safety-warning .icon {
      font-size: 20px;
      color: #f59e0b;
      flex-shrink: 0;
    }
    
    .safety-warning .text {
      color: #92400e;
      font-weight: 600;
    }
    
    .check-instructions {
      background: #f0f9ff;
      border: 1px solid #0ea5e9;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }
    
    .check-instructions h4 {
      color: #0c4a6e;
      margin-bottom: 12px;
      font-size: 16px;
    }
    
    .check-list {
      list-style: disc;
      padding-left: 20px;
    }
    
    .check-list li {
      background: white;
      margin-bottom: 8px;
      padding: 12px 16px;
      border-radius: 8px;
      border-left: 3px solid #0ea5e9;
      position: relative;
    }
    
    .question-section {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
      border: 2px solid #e2e8f0;
    }
    
    .question-text {
      font-size: 18px;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 20px;
    }
    
    .button-group {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 24px;
    }
    
    .choice-button {
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 12px;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 120px;
    }
    
    .choice-button:hover {
      background: #b91c1c;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
    
    .choice-button.yes {
      background: #10b981;
    }
    
    .choice-button.yes:hover {
      background: #059669;
    }
    
    .choice-button.no {
      background: #ef4444;
    }
    
    .choice-button.no:hover {
      background: #dc2626;
    }
    
    .outcome-section {
      background: #f0fdf4;
      border: 2px solid #16a34a;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      text-align: center;
      display: none;
    }
    
    .outcome-section.show {
      display: block;
      animation: fadeIn 0.5s ease;
    }
    
    .outcome-section.escalate {
      background: #fef2f2;
      border-color: #dc2626;
    }
    
    .outcome-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    
    .outcome-title {
      font-size: 20px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #16a34a;
    }
    
    .outcome-section.escalate .outcome-title {
      color: #dc2626;
    }
    
    .outcome-text {
      font-size: 16px;
      color: #374151;
      margin-bottom: 20px;
    }
    
    .complaint-form {
      background: #f8fafc;
      border-radius: 12px;
      padding: 24px;
      margin: 24px 0;
      display: none;
    }
    
    .complaint-form.show {
      display: block;
      animation: slideIn 0.3s ease;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-label {
      display: block;
      font-weight: 600;
      color: #374151;
      margin-bottom: 8px;
    }
    
    .form-input, .form-textarea {
      width: 100%;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 16px;
      background: white;
    }
    
    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }
    
    .form-input:focus, .form-textarea:focus {
      outline: none;
      border-color: #dc2626;
      ring: 2px solid rgba(220, 38, 38, 0.1);
    }
    
    .readonly {
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .summary-section {
      background: #fef2f2;
      border: 1px solid #dc2626;
      border-radius: 8px;
      padding: 16px;
      margin: 16px 0;
    }
    
    .summary-title {
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 8px;
    }
    
    .restart-button {
      background: #6b7280;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 14px;
      cursor: pointer;
      margin-top: 16px;
    }
    
    @media (max-width: 640px) {
      .button-group {
        flex-direction: column;
      }
      
      .choice-button {
        width: 100%;
      }
      
      .content-area {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <h1>🔧 Device Troubleshooting</h1>
      <p>Let's diagnose your ${troubleshootingFlow.deviceName} issue step by step</p>
      
      <div class="device-info">
        <div>
          <strong>${troubleshootingFlow.medicineName}</strong>
        </div>
      </div>
    </div>
    
    <div class="content-area">
      <div class="progress-bar">
        <div class="progress-fill" id="progress-fill" style="width: 0%"></div>
      </div>
      
      ${troubleshootingFlow.steps.map((step, index) => `
        <div class="step-container ${index === 0 ? 'active' : ''}" id="step-${step.id}">
          <div class="step-header">
            <div class="step-number">${index + 1}</div>
            <h2 class="step-title">${step.title}</h2>
          </div>
          
          <p class="step-description">${step.description}</p>
          
          ${step.visual ? `
            <div class="device-visual">
              <img src="${step.visual}" alt="${step.title}">
              <p style="color: #6b7280; font-size: 14px;"></p>
            </div>
          ` : ''}
          
          ${step.safetyWarning ? `
            <div class="safety-warning">
              <div class="icon">⚠️</div>
              <div class="text">Safety Warning: ${step.safetyWarning}</div>
            </div>
          ` : ''}
          
          <div class="check-instructions">
            <h4>Please check the following:</h4>
            <ul class="check-list">
              ${step.checkInstructions.map(instruction => `<li>${instruction}</li>`).join('')}
            </ul>
          </div>
          
          <div class="question-section">
            <div class="question-text">
              Based on what you observed, does everything look correct?
            </div>
            <div class="button-group">
              <button class="choice-button yes" onclick="handleChoice('${step.id}', 'yes')">
                ✅ Yes
              </button>
              <button class="choice-button no" onclick="handleChoice('${step.id}', 'no')">
                ❌ No
              </button>
            </div>
          </div>
        </div>
      `).join('')}
      
      <!-- Outcome Section -->
      <div class="outcome-section" id="outcome-section">
        <div class="outcome-icon" id="outcome-icon">✅</div>
        <h3 class="outcome-title" id="outcome-title">Troubleshooting Complete</h3>
        <p class="outcome-text" id="outcome-text"></p>
        
        <div class="button-group">
          <button class="choice-button" id="primary-action-btn" style="display: none;">
            Action
          </button>
          <button class="choice-button no" onclick="restartFlow()">
            Start Over
          </button>
        </div>
      </div>
      
      <!-- Product Quality Complaint Form -->
      <div class="complaint-form" id="complaint-form">
        <h3 style="color: #dc2626; margin-bottom: 16px;">📋 Product Quality Report</h3>
        <p style="color: #6b7280; margin-bottom: 20px;">
          We'll report this issue to our product quality team. Please provide additional details:
        </p>
        
        <form id="quality-complaint-form">
          <div class="form-group">
            <label class="form-label">Product Information</label>
            <input type="text" class="form-input readonly" value="${troubleshootingFlow.medicineName} - ${troubleshootingFlow.deviceName}" readonly>
          </div>
          
          <div class="form-group">
            <label class="form-label">Issue Type</label>
            <input type="text" class="form-input readonly" value="Device not functioning as expected" readonly>
          </div>
          
          <div class="form-group">
            <label class="form-label">When did this issue occur? *</label>
            <input type="datetime-local" class="form-input" id="occurrence-date" required>
          </div>
          
          <div class="form-group">
            <label class="form-label">Lot Number (if available)</label>
            <input type="text" class="form-input" id="lot-number" placeholder="Found on pen label">
          </div>
          
          <div class="form-group">
            <label class="form-label">Additional Details</label>
            <textarea class="form-textarea" id="additional-details" 
              placeholder="Please describe exactly what happened and any other relevant information..."></textarea>
          </div>
          
          <div class="summary-section">
            <div class="summary-title">Troubleshooting Summary</div>
            <div id="troubleshooting-summary">Your responses will be included in the report.</div>
          </div>
          
          <div class="button-group">
            <button type="submit" class="choice-button">
              📤 Submit Report
            </button>
            <button type="button" class="choice-button no" onclick="cancelComplaint()">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
  
  <script>
    const flowSteps = ${JSON.stringify(troubleshootingFlow.steps)};
    const outcomes = ${JSON.stringify(troubleshootingFlow.outcomes)};
    let currentStepIndex = 0;
    let userResponses = {};
    let troubleshootingSummary = [];
    
    function updateProgress() {
      const progress = ((currentStepIndex + 1) / flowSteps.length) * 100;
      document.getElementById('progress-fill').style.width = progress + '%';
    }
    
    function showStep(stepId) {
      // Hide all steps
      document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
      });
      
      // Show target step
      const targetStep = document.getElementById('step-' + stepId);
      if (targetStep) {
        targetStep.classList.add('active');
      }
    }
    
    function handleChoice(stepId, choice) {
      const step = flowSteps.find(s => s.id === stepId);
      if (!step) return;
      
      userResponses[stepId] = choice;
      troubleshootingSummary.push(\`\${step.title}: \${choice === 'yes' ? 'Yes' : 'No'}\`);
      
      const action = choice === 'yes' ? step.yesAction : step.noAction;
      
      if (action.type === 'next' && action.nextStepId) {
        // Move to next step
        currentStepIndex = flowSteps.findIndex(s => s.id === action.nextStepId);
        showStep(action.nextStepId);
        updateProgress();
      } else if (action.type === 'complete') {
        // Show resolution
        showOutcome(action.outcome, 'resolved');
      } else if (action.type === 'escalate') {
        // Show escalation outcome
        showOutcome(action.outcome, 'escalate');
      }
      
      // Update widget state
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          currentStep: stepId,
          userResponses: userResponses,
          flowProgress: currentStepIndex + 1,
          medicineId: '${troubleshootingFlow.medicineId}',
          viewMode: 'interactive-troubleshooting'
        });
      }
    }
    
    function showOutcome(outcomeText, type) {
      // Hide all steps
      document.querySelectorAll('.step-container').forEach(step => {
        step.classList.remove('active');
      });
      
      const outcomeSection = document.getElementById('outcome-section');
      const outcomeIcon = document.getElementById('outcome-icon');
      const outcomeTitle = document.getElementById('outcome-title');
      const outcomeTextEl = document.getElementById('outcome-text');
      const primaryBtn = document.getElementById('primary-action-btn');
      
      if (type === 'escalate') {
        outcomeSection.className = 'outcome-section escalate show';
        outcomeIcon.textContent = '🚨';
        outcomeTitle.textContent = 'Issue Needs Investigation';
        primaryBtn.textContent = '📋 Log Product Quality Complaint';
        primaryBtn.style.display = 'block';
        primaryBtn.onclick = showComplaintForm;
      } else {
        outcomeSection.className = 'outcome-section show';
        outcomeIcon.textContent = '✅';
        outcomeTitle.textContent = 'Issue Resolved';
        primaryBtn.style.display = 'none';
      }
      
      outcomeTextEl.textContent = outcomeText;
      updateProgress();
    }
    
    function showComplaintForm() {
      document.getElementById('outcome-section').style.display = 'none';
      document.getElementById('complaint-form').classList.add('show');
      
      // Set current date/time
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      document.getElementById('occurrence-date').value = now.toISOString().slice(0, 16);
      
      // Update summary
      document.getElementById('troubleshooting-summary').innerHTML = 
        troubleshootingSummary.join('<br>');
    }
    
    function cancelComplaint() {
      document.getElementById('complaint-form').classList.remove('show');
      document.getElementById('outcome-section').style.display = 'block';
    }
    
    function restartFlow() {
      currentStepIndex = 0;
      userResponses = {};
      troubleshootingSummary = [];
      
      // Hide outcome and complaint form
      document.getElementById('outcome-section').classList.remove('show');
      document.getElementById('complaint-form').classList.remove('show');
      
      // Show first step
      showStep(flowSteps[0].id);
      updateProgress();
    }
    
    // Handle complaint form submission
    document.getElementById('quality-complaint-form').addEventListener('submit', function(e) {
      e.preventDefault();
      
      const formData = {
        medicineId: '${troubleshootingFlow.medicineId}',
        medicineName: '${troubleshootingFlow.medicineName}',
        deviceName: '${troubleshootingFlow.deviceName}',
        issueType: '${troubleshootingFlow.issueType}',
        occurrenceDate: document.getElementById('occurrence-date').value,
        lotNumber: document.getElementById('lot-number').value,
        additionalDetails: document.getElementById('additional-details').value,
        troubleshootingSteps: troubleshootingSummary,
        userResponses: userResponses,
        timestamp: new Date().toISOString()
      };
      
      // Show success message
      const complaintForm = document.getElementById('complaint-form');
      complaintForm.innerHTML = \`
        <div style="text-align: center; padding: 40px;">
          <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
          <h3 style="color: #16a34a; margin-bottom: 12px;">Report Submitted Successfully</h3>
          <p style="color: #374151; margin-bottom: 20px;">
            Your product quality report has been submitted. Reference ID: PQ-\${Date.now().toString().slice(-6)}
          </p>
          <p style="color: #6b7280; font-size: 14px;">
            Do not use this pen. If you have concerns about your dose or symptoms, please contact your healthcare provider.
          </p>
        </div>
      \`;
      
      // Update widget state
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          complaintSubmitted: true,
          complaintData: formData,
          viewMode: 'interactive-troubleshooting'
        });
      }
    });
    
    // Initialize
    updateProgress();
    console.log('Interactive troubleshooting widget loaded for ${troubleshootingFlow.medicineName}');
  </script>
</body>
</html>`;
}

/**
 * Generates HTML for the Product Support widget.
 * Creates an interactive support page with three tabs for different support resources.
 * 
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
function createProductSupportWidgetHTML(): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Product Support - Lilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f8fafc;
      color: #1f2937;
      line-height: 1.6;
      padding: 20px;
    }
    
    .widget-container { 
      width: 100%; 
      max-width: 900px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      overflow: hidden;
    }
    
    .widget-header {
      background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
      color: white;
      padding: 24px;
      text-align: center;
    }
    
    .widget-header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .widget-header p {
      font-size: 14px;
      opacity: 0.9;
    }
    
    .hero-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
    }
    
    .content-area {
      padding: 32px;
    }
    
    .tab-navigation {
      display: flex;
      border-bottom: 2px solid #e5e7eb;
      margin-bottom: 24px;
      overflow-x: auto;
    }
    
    .tab-button {
      background: none;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border-bottom: 3px solid transparent;
      transition: all 0.2s;
      white-space: nowrap;
      color: #6b7280;
    }
    
    .tab-button:hover {
      color: #dc2626;
    }
    
    .tab-button.active {
      color: #dc2626;
      border-bottom-color: #dc2626;
    }
    
    .tab-content {
      display: none;
    }
    
    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .support-card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 20px;
      border: 1px solid #e5e7eb;
      transition: box-shadow 0.2s;
    }
    
    .support-card:hover {
      box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    }
    
    .support-card h3 {
      font-size: 18px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .support-card p {
      color: #6b7280;
      margin-bottom: 16px;
    }
    
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 16px;
      margin-top: 20px;
    }
    
    .contact-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      border: 1px solid #e5e7eb;
      transition: all 0.2s;
    }
    
    .contact-card:hover {
      border-color: #dc2626;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.1);
    }
    
    .contact-card .icon {
      font-size: 32px;
      margin-bottom: 12px;
    }
    
    .contact-card h4 {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 8px;
    }
    
    .contact-card a {
      color: #dc2626;
      text-decoration: none;
      font-weight: 600;
      font-size: 18px;
    }
    
    .contact-card a:hover {
      text-decoration: underline;
    }
    
    .contact-card p {
      color: #6b7280;
      font-size: 13px;
      margin-top: 8px;
    }
    
    .faq-item {
      background: white;
      border-radius: 8px;
      margin-bottom: 12px;
      border: 1px solid #e5e7eb;
      overflow: hidden;
    }
    
    .faq-question {
      padding: 16px 20px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-weight: 600;
      color: #1f2937;
    }
    
    .faq-question:hover {
      background: #f9fafb;
    }
    
    .faq-arrow {
      transition: transform 0.2s;
    }
    
    .faq-item.expanded .faq-arrow {
      transform: rotate(180deg);
    }
    
    .faq-answer {
      padding: 0 20px;
      max-height: 0;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .faq-item.expanded .faq-answer {
      padding: 0 20px 16px;
      max-height: 500px;
    }
    
    .faq-answer p {
      color: #6b7280;
      line-height: 1.6;
    }
    
    .resource-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #dc2626;
      color: white;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      transition: background 0.2s;
    }
    
    .resource-link:hover {
      background: #b91c1c;
    }
    
    .resource-list {
      list-style: none;
      margin: 16px 0;
    }
    
    .resource-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .resource-list li:last-child {
      border-bottom: none;
    }
    
    .resource-list a {
      color: #dc2626;
      text-decoration: none;
      font-weight: 500;
    }
    
    .resource-list a:hover {
      text-decoration: underline;
    }
    
    .hero-image-container {
      position: relative;
      width: 100%;
      max-height: 300px;
      overflow: hidden;
    }
    
    .hero-image {
      width: 100%;
      max-height: 300px;
      object-fit: cover;
      display: none;
    }
    
    .hero-image.active {
      display: block;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="hero-image-container">
      <img id="hero-contact" src="https://qa.unex.lilly.com/producthelp/assets/product-support-image-CiK20MOm.jpeg" alt="Contact Support" class="hero-image active" crossorigin="anonymous" referrerpolicy="no-referrer">
      <img id="hero-faq" src="https://qa.unex.lilly.com/producthelp/assets/shipping-issues-image-Dwq-0tku.jpeg" alt="FAQ" class="hero-image" crossorigin="anonymous" referrerpolicy="no-referrer">
      <img id="hero-resources" src="https://qa.unex.lilly.com/producthelp/assets/side-effects-image-DdQ_UcU5.jpeg" alt="Resources" class="hero-image" crossorigin="anonymous" referrerpolicy="no-referrer">
    </div>
    
    <div class="widget-header">
      <h1>🛟 Product Support</h1>
      <p>Get help with your Lilly medications and devices</p>
    </div>
    
    <div class="content-area">
      <div class="tab-navigation">
        <button class="tab-button active" onclick="showTab('contact')">📞 Contact Us</button>
        <button class="tab-button" onclick="showTab('faq')">❓ FAQ</button>
        <button class="tab-button" onclick="showTab('resources')">📚 Resources</button>
      </div>
      
      <!-- Contact Us Tab -->
      <div id="contact" class="tab-content active">
        <h2 style="margin-bottom: 16px; font-size: 20px;">Get in Touch</h2>
        <p style="color: #6b7280; margin-bottom: 24px;">Our support team is here to help you with any questions about your Lilly products.</p>
        
        <div class="contact-grid">
          <div class="contact-card">
            <div class="icon">📞</div>
            <h4>Lilly Customer Support</h4>
            <a href="tel:1-800-545-5979">1-800-LillyRx</a>
            <p>Mon-Fri: 8AM - 8PM ET</p>
          </div>
          
          <div class="contact-card">
            <div class="icon">💊</div>
            <h4>Lilly Direct Pharmacy</h4>
            <a href="tel:1-833-808-1234">1-833-808-1234</a>
            <p>For prescription orders</p>
          </div>
          
          <div class="contact-card">
            <div class="icon">🆘</div>
            <h4>Medical Emergency</h4>
            <a href="tel:911">911</a>
            <p>For urgent medical situations</p>
          </div>
        </div>
        
        <div class="support-card" style="margin-top: 24px;">
          <h3>💬 Need More Help?</h3>
          <p>If you have questions about your medication, side effects, or device usage, our team is ready to assist you.</p>
          <a href="https://www.lilly.com/contact-us" target="_blank" class="resource-link">
            Visit Lilly Support Center
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="white" viewBox="0 0 256 256">
              <path d="M224,104a8,8,0,0,1-16,0V59.31l-66.35,66.34a8,8,0,0,1-11.32-11.32L196.69,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/>
            </svg>
          </a>
        </div>
      </div>
      
      <!-- FAQ Tab -->
      <div id="faq" class="tab-content">
        <h2 style="margin-bottom: 16px; font-size: 20px;">Frequently Asked Questions</h2>
        
        <div class="faq-item" onclick="toggleFaq(this)">
          <div class="faq-question">
            <span>How do I store my medication properly?</span>
            <span class="faq-arrow">▼</span>
          </div>
          <div class="faq-answer">
            <p>Most Lilly injectable medications should be stored in the refrigerator at 36°F to 46°F (2°C to 8°C). Do not freeze. Once in use, some medications can be kept at room temperature for a limited time. Always check the specific storage instructions for your medication on the packaging or patient information leaflet.</p>
          </div>
        </div>
        
        <div class="faq-item" onclick="toggleFaq(this)">
          <div class="faq-question">
            <span>What should I do if I miss a dose?</span>
            <span class="faq-arrow">▼</span>
          </div>
          <div class="faq-answer">
            <p>If you miss a dose, take it as soon as you remember unless it's close to your next scheduled dose. Do not take two doses at the same time. If you're unsure, contact your healthcare provider or pharmacist for guidance specific to your medication.</p>
          </div>
        </div>
        
        <div class="faq-item" onclick="toggleFaq(this)">
          <div class="faq-question">
            <span>How do I report a side effect or adverse event?</span>
            <span class="faq-arrow">▼</span>
          </div>
          <div class="faq-answer">
            <p>You can report side effects to Lilly by calling 1-800-LillyRx (1-800-545-5979). You can also report adverse events directly to the FDA's MedWatch program at 1-800-FDA-1088 or online at www.fda.gov/medwatch.</p>
          </div>
        </div>
        
        <div class="faq-item" onclick="toggleFaq(this)">
          <div class="faq-question">
            <span>Where can I find patient assistance programs?</span>
            <span class="faq-arrow">▼</span>
          </div>
          <div class="faq-answer">
            <p>Lilly offers various patient assistance programs including the Lilly Cares Foundation and savings cards. Visit lillycares.com or call 1-800-545-6962 to learn about eligibility and enrollment for assistance programs that may help reduce your medication costs.</p>
          </div>
        </div>
        
        <div class="faq-item" onclick="toggleFaq(this)">
          <div class="faq-question">
            <span>How do I dispose of used needles and pens?</span>
            <span class="faq-arrow">▼</span>
          </div>
          <div class="faq-answer">
            <p>Used needles and injection pens should be placed in an FDA-cleared sharps disposal container. Never throw loose needles in the trash. Many pharmacies and hospitals have sharps disposal programs. Contact your local waste management for disposal options in your area.</p>
          </div>
        </div>
      </div>
      
      <!-- Resources Tab -->
      <div id="resources" class="tab-content">
        <h2 style="margin-bottom: 16px; font-size: 20px;">Helpful Resources</h2>
        
        <div class="support-card">
          <h3>📋 Patient Guides & Instructions</h3>
          <p>Download detailed guides for your Lilly medications and devices.</p>
          <ul class="resource-list">
            <li>📄 <a href="https://www.lilly.com/resources" target="_blank">Medication Patient Information Leaflets</a></li>
            <li>📄 <a href="https://www.lilly.com/resources" target="_blank">Injection Pen User Guides</a></li>
            <li>📄 <a href="https://www.lilly.com/resources" target="_blank">Storage & Handling Instructions</a></li>
          </ul>
        </div>
        
        <div class="support-card">
          <h3>🎬 Training Videos</h3>
          <p>Watch step-by-step video tutorials on how to use your medication devices.</p>
          <ul class="resource-list">
            <li>▶️ <a href="https://www.lilly.com/resources" target="_blank">How to Use Your Injection Pen</a></li>
            <li>▶️ <a href="https://www.lilly.com/resources" target="_blank">Proper Injection Technique</a></li>
            <li>▶️ <a href="https://www.lilly.com/resources" target="_blank">Troubleshooting Common Issues</a></li>
          </ul>
        </div>
        
        <div class="support-card">
          <h3>💰 Savings & Assistance Programs</h3>
          <p>Learn about programs that may help reduce your medication costs.</p>
          <ul class="resource-list">
            <li>💳 <a href="https://www.lillycares.com" target="_blank">Lilly Cares Patient Assistance</a></li>
            <li>💳 <a href="https://www.lilly.com/savings" target="_blank">Copay Savings Cards</a></li>
            <li>💳 <a href="https://www.insulinaffordability.com" target="_blank">Insulin Affordability Programs</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
  
  <script>
    function showTab(tabId) {
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active');
      });
      
      // Switch hero images
      document.querySelectorAll('.hero-image').forEach(img => {
        img.classList.remove('active');
      });
      
      document.getElementById(tabId).classList.add('active');
      document.getElementById('hero-' + tabId).classList.add('active');
      event.target.classList.add('active');
      
      // Update widget state
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          activeTab: tabId,
          viewMode: 'product-support'
        });
      }
    }
    
    function toggleFaq(element) {
      const isExpanded = element.classList.contains('expanded');
      
      // Close all FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('expanded');
      });
      
      // Toggle clicked FAQ
      if (!isExpanded) {
        element.classList.add('expanded');
      }
    }
    
    console.log('Product Support widget loaded');
  </script>
</body>
</html>`;
}

// ==================== UI RESOURCES ====================

// Lilly Direct Store Resource (All medicines available for purchase)
server.registerResource(
  'lilly-direct-store',
  'ui://widget/lilly-direct-store-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://lilly-direct-store.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com',
          'https://delivery-p137454-e1438138.adobeaemcloud.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/lilly-direct-store-v1.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML(),
        _meta: {
          'openai/widgetDomain': 'https://lilly-direct-store.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://logosandtypes.com',
              'https://delivery-p137454-e1438138.adobeaemcloud.com'
            ]
          }
        }
      },
    ]
  })
);

// Lilly Direct Single Medicine Resource (Individual medicine purchase page)
server.registerResource(
  'lilly-direct-medicine',
  'ui://widget/lilly-direct-medicine-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://lilly-direct-medicine.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://logosandtypes.com',
          'https://delivery-p137454-e1438138.adobeaemcloud.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/lilly-direct-medicine-v1.html',
        mimeType: 'text/html+skybridge',
        text: createMedicineCarouselHTML([AVAILABLE_MEDICINES[0]]),
        _meta: {
          'openai/widgetDomain': 'https://lilly-direct-medicine.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: [
              'https://upload.wikimedia.org',
              'https://logosandtypes.com',
              'https://delivery-p137454-e1438138.adobeaemcloud.com'
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

// Nearby Pharmacy Map Resource
server.registerResource(
  'nearby-pharmacy-map',
  'ui://widget/nearby-pharmacy-map-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://nearby-pharmacy.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [
          'https://nominatim.openstreetmap.org'
        ],
        resource_domains: [
          'https://unpkg.com',
          'https://tile.openstreetmap.org',
          'https://upload.wikimedia.org',
          'https://delivery-p137454-e1438138.adobeaemcloud.com'
        ]
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/nearby-pharmacy-map-v1.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Nearby Pharmacies</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    :root {
      --bg: #f5f7fb;
      --card: #ffffff;
      --brand: #e81f26;
      --text: #1f2937;
      --muted: #6b7280;
      --shadow: 0 8px 24px rgba(0,0,0,.08);
      --radius: 16px;
    }
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      padding: 16px;
    }
    
    .container {
      max-width: 800px;
      margin: 0 auto;
    }
    
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    
    .header img {
      height: 32px;
      width: auto;
    }
    
    .header h1 {
      font-size: 20px;
      font-weight: 600;
      color: var(--text);
    }
    
    .map-container {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      margin-bottom: 16px;
    }
    
    #map {
      height: 400px;
      width: 100%;
    }
    
    .pharmacy-list {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
    }
    
    .pharmacy-list h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
    }
    
    .pharmacy-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px;
      border-radius: 8px;
      transition: background 0.2s;
      cursor: pointer;
    }
    
    .pharmacy-item:hover {
      background: #f3f4f6;
    }
    
    .pharmacy-icon {
      width: 40px;
      height: 40px;
      background: var(--brand);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .pharmacy-icon svg {
      width: 20px;
      height: 20px;
      fill: white;
    }
    
    .pharmacy-info {
      flex: 1;
    }
    
    .pharmacy-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .pharmacy-address {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 4px;
    }
    
    .pharmacy-distance {
      font-size: 12px;
      color: var(--brand);
      font-weight: 500;
    }
    
    .pharmacy-hours {
      font-size: 12px;
      color: var(--muted);
    }
    
    .open-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #10b981;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    .closed-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #ef4444;
      color: white;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 500;
      margin-left: 8px;
    }
    
    #skeleton {
      text-align: center;
      padding: 60px 20px;
      color: var(--muted);
    }
    
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid #e5e7eb;
      border-top-color: var(--brand);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .error-message {
      background: #fef2f2;
      color: #dc2626;
      padding: 12px 16px;
      border-radius: 8px;
      text-align: center;
      margin-bottom: 16px;
    }
    
    .leaflet-popup-content {
      margin: 12px;
    }
    
    .popup-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    
    .popup-address {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .popup-directions {
      display: inline-block;
      padding: 6px 12px;
      background: #e81f26;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .popup-directions:hover {
      background: #c81e1e;
    }
    
    @media (max-width: 640px) {
      #map { height: 300px; }
      .header h1 { font-size: 18px; }
    }
    
    /* Lilly Direct medicine banner styles */
    .lilly-direct-section {
      background: var(--card);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      padding: 16px;
      margin-bottom: 16px;
    }
    
    .lilly-direct-section h2 {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      color: var(--text);
    }
    
    .medicine-single {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      background: #fafafa;
    }
    
    .medicine-single img {
      width: 80px;
      height: 80px;
      object-fit: contain;
      border-radius: 8px;
    }
    
    .medicine-single-info {
      flex: 1;
    }
    
    .medicine-single-name {
      font-weight: 600;
      font-size: 16px;
      margin-bottom: 4px;
    }
    
    .medicine-single-label {
      font-size: 13px;
      color: var(--muted);
      margin-bottom: 8px;
    }
    
    .medicine-buy-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 18px;
      background: var(--brand);
      color: white;
      text-decoration: none;
      border-radius: 9999px;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
    }
    
    .medicine-buy-btn:hover {
      background: #c41922;
    }
    
    .medicine-carousel {
      display: flex;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }
    
    .medicine-carousel::-webkit-scrollbar {
      height: 4px;
    }
    
    .medicine-carousel::-webkit-scrollbar-thumb {
      background: #d1d5db;
      border-radius: 2px;
    }
    
    .medicine-card {
      flex: 0 0 160px;
      scroll-snap-align: start;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 12px;
      background: #fafafa;
      text-align: center;
      transition: border-color 0.2s;
    }
    
    .medicine-card:hover {
      border-color: var(--brand);
    }
    
    .medicine-card img {
      width: 60px;
      height: 60px;
      object-fit: contain;
      margin-bottom: 8px;
    }
    
    .medicine-card-name {
      font-weight: 600;
      font-size: 13px;
      margin-bottom: 6px;
    }
    
    .medicine-card-btn {
      display: inline-block;
      padding: 5px 12px;
      background: var(--brand);
      color: white;
      text-decoration: none;
      border-radius: 9999px;
      font-size: 11px;
      font-weight: 500;
    }
    
    .medicine-card-btn:hover {
      background: #c41922;
    }
  </style>
</head>
<body>
  <div id="skeleton">
    <div class="spinner"></div>
    <p>Finding nearby pharmacies...</p>
  </div>
  
  <div id="root" hidden>
    <div class="container">
      <div class="header">
        <img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly" />
        <h1>Nearby Pharmacies</h1>
      </div>
      
      <div id="error-container"></div>
      
      <div id="lilly-direct-container"></div>
      
      <div class="map-container">
        <div id="map"></div>
      </div>
      
      <div class="pharmacy-list">
        <h2>📍 Pharmacies Near You</h2>
        <div id="pharmacy-items"></div>
      </div>
    </div>
  </div>

  <script>
    const skeleton = document.getElementById('skeleton');
    const root = document.getElementById('root');
    const errorContainer = document.getElementById('error-container');
    const pharmacyItems = document.getElementById('pharmacy-items');
    
    let map = null;
    let markers = [];
    let userMarker = null;
    
    // Pharmacy icon for markers
    const pharmacyIcon = L.divIcon({
      html: '<div style="background:#e81f26;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"><svg width="16" height="16" fill="white" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg></div>',
      className: 'pharmacy-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
    
    // User location icon
    const userIcon = L.divIcon({
      html: '<div style="background:#3b82f6;width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>',
      className: 'user-marker',
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });
    
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return (R * c).toFixed(1);
    }
    
    function isPharmacyOpen() {
      const hour = new Date().getHours();
      return hour >= 8 && hour < 21;
    }
    
    function showError(message) {
      errorContainer.innerHTML = '<div class="error-message">' + message + '</div>';
    }
    
    function initMap(userLat, userLng, pharmacies) {
      // Initialize map centered on user
      map = L.map('map').setView([userLat, userLng], 13);
      
      // Add OpenStreetMap tiles
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);
      
      // Add user marker
      userMarker = L.marker([userLat, userLng], { icon: userIcon })
        .addTo(map)
        .bindPopup('<strong>📍 Your Location</strong>');
      
      // Add pharmacy markers
      const bounds = L.latLngBounds([[userLat, userLng]]);
      
      pharmacies.forEach((pharmacy, index) => {
        const marker = L.marker([pharmacy.lat, pharmacy.lng], { icon: pharmacyIcon })
          .addTo(map)
          .bindPopup(
            '<div class="popup-name">' + pharmacy.name + '</div>' +
            '<div class="popup-address">' + pharmacy.address + '</div>' +
            '<a class="popup-directions" href="https://www.google.com/maps/dir/?api=1&destination=' + 
            encodeURIComponent(pharmacy.address) + '" target="_blank">Get Directions</a>'
          );
        
        markers.push(marker);
        bounds.extend([pharmacy.lat, pharmacy.lng]);
      });
      
      // Fit map to show all markers
      if (pharmacies.length > 0) {
        map.fitBounds(bounds, { padding: [50, 50] });
      }
    }
    
    function renderPharmacyList(pharmacies, userLat, userLng) {
      pharmacyItems.innerHTML = pharmacies.map((pharmacy, index) => {
        const distance = calculateDistance(userLat, userLng, pharmacy.lat, pharmacy.lng);
        const isOpen = isPharmacyOpen();
        const statusBadge = isOpen 
          ? '<span class="open-badge">Open</span>'
          : '<span class="closed-badge">Closed</span>';
        
        return '<div class="pharmacy-item" onclick="focusPharmacy(' + index + ')">' +
          '<div class="pharmacy-icon">' +
            '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-4v-4H6v-4h4V6h4v4h4v4z"/></svg>' +
          '</div>' +
          '<div class="pharmacy-info">' +
            '<div class="pharmacy-name">' + pharmacy.name + statusBadge + '</div>' +
            '<div class="pharmacy-address">' + pharmacy.address + '</div>' +
            '<div class="pharmacy-distance">📍 ' + distance + ' miles away</div>' +
            '<div class="pharmacy-hours">Hours: 8:00 AM - 9:00 PM</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    
    window.focusPharmacy = function(index) {
      if (markers[index]) {
        map.setView(markers[index].getLatLng(), 16);
        markers[index].openPopup();
      }
    };
    
    function renderIfReady() {
      const out = window.openai?.toolOutput || {};
      const pharmacies = out.pharmacies || [];
      const userLocation = out.userLocation || null;
      const error = out.error || null;
      const lillyDirect = out.lillyDirect || null;
      
      if (error) {
        skeleton.hidden = true;
        root.hidden = false;
        showError(error);
        // Still render Lilly Direct even on error
        if (lillyDirect) renderLillyDirect(lillyDirect);
        return;
      }
      
      if (!pharmacies.length || !userLocation) return;
      
      skeleton.hidden = true;
      root.hidden = false;
      
      // Render Lilly Direct medicine section above the map
      if (lillyDirect) renderLillyDirect(lillyDirect);
      
      initMap(userLocation.lat, userLocation.lng, pharmacies);
      renderPharmacyList(pharmacies, userLocation.lat, userLocation.lng);
      
      // Sync state with ChatGPT
      if (window.oai?.widget?.setState) {
        window.oai.widget.setState({
          pharmacyCount: pharmacies.length,
          userLocation: userLocation
        });
      }
    }
    
    function renderLillyDirect(data) {
      const container = document.getElementById('lilly-direct-container');
      if (!container || !data || !data.items || !data.items.length) return;
      
      if (data.type === 'single') {
        const med = data.items[0];
        container.innerHTML = '<div class="lilly-direct-section">' +
          '<h2>\uD83D\uDED2 Buy ' + med.name + ' Online from Lilly Direct</h2>' +
          '<div class="medicine-single">' +
            '<img src="' + med.image + '" alt="' + med.name + '" crossorigin="anonymous" referrerpolicy="no-referrer" />' +
            '<div class="medicine-single-info">' +
              '<div class="medicine-single-name">' + med.name + '</div>' +
              '<div class="medicine-single-label">FDA-approved \u2022 Free delivery</div>' +
              '<a href="' + med.buyLink + '" target="_blank" class="medicine-buy-btn">' +
                med.buyLinkText + ' \u2192' +
              '</a>' +
            '</div>' +
          '</div>' +
        '</div>';
      } else {
        container.innerHTML = '<div class="lilly-direct-section">' +
          '<h2>\uD83D\uDED2 Buy Medicines Online from Lilly Direct</h2>' +
          '<div class="medicine-carousel">' +
            data.items.map(function(med) {
              return '<div class="medicine-card">' +
                '<img src="' + med.image + '" alt="' + med.name + '" crossorigin="anonymous" referrerpolicy="no-referrer" />' +
                '<div class="medicine-card-name">' + med.name + '</div>' +
                '<a href="' + med.buyLink + '" target="_blank" class="medicine-card-btn">' + med.buyLinkText + '</a>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>';
      }
    }
    
    renderIfReady();
    window.addEventListener('openai:set_globals', renderIfReady);
    window.addEventListener('openai:tool_response', renderIfReady);
  </script>
</body>
</html>`,
        _meta: {
          'openai/widgetDomain': 'https://nearby-pharmacy.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [
              'https://nominatim.openstreetmap.org'
            ],
            resource_domains: [
              'https://unpkg.com',
              'https://tile.openstreetmap.org',
              'https://upload.wikimedia.org',
              'https://delivery-p137454-e1438138.adobeaemcloud.com'
            ]
          }
        }
      },
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
        connect_domains: [
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://uspl.lilly.com',
          'https://pi.lilly.com'
        ],
        resource_domains: [
          'https://upload.wikimedia.org',
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://*.adobeaemcloud.com',
          'https://uspl.lilly.com',
          'https://pi.lilly.com'
        ],
        media_domains: [
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://*.adobeaemcloud.com'
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
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; media-src 'self' https://delivery-p137454-e1438138.adobeaemcloud.com https://*.adobeaemcloud.com blob: data:; img-src 'self' https://delivery-p137454-e1438138.adobeaemcloud.com https://*.adobeaemcloud.com https://upload.wikimedia.org data:;">
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
      height: 420px;
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
      background: rgba(0,0,0,0.85);
      z-index: 1000;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .video-modal.active {
      display: flex;
    }

    .video-container {
      max-width: 900px;
      width: 100%;
      background: #000;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }

    .video-container video {
      width: 100%;
      max-height: 80vh;
    }

    .video-close {
      position: absolute;
      top: -40px;
      right: 0;
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
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }

    .video-close:hover {
      background: #fff;
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

      <div class="video-section hidden" id="video-section">
        <button class="video-btn" id="watch-video-btn">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
            <path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/>
          </svg>
          Watch Training Video
        </button>
        <a href="https://uspl.lilly.com/zepbound/zepbound.html#ug" target="_blank" class="video-btn" style="margin-left: 10px; text-decoration: none;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
            <path d="M224,104a8,8,0,0,1-16,0V59.31l-66.35,66.34a8,8,0,0,1-11.31-11.31L196.69,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/>
          </svg>
          Official Instructions
        </a>
      </div>
    </div>

    <!-- Video Modal -->
    <div class="video-modal" id="video-modal">
      <div class="video-container">
        <button class="video-close" id="video-close">&times;</button>
        <video id="video-player" controls preload="metadata">
          <source id="video-source" src="" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      </div>
    </div>
  </div>

  <script>
    // Injection steps data - will be populated from tool output (4 simple steps)
    // Images loaded from Adobe AEM CDN
    const defaultSteps = [
      {
        title: "Step 1: Choose Your Injection Site",
        description: "You may inject in your stomach (at least 2 inches from belly button), thigh, or upper arm. Rotate sites weekly.",
        warning: "Do not inject into tender, bruised, red, or hard skin.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d0514e55-3fb6-4541-a31a-dd466f7ad415/as/injection_step_1.avif?assetname=injection_step_1.png&width=1200&format=avif"
      },
      {
        title: "Step 2: Pull Off the Gray Base Cap",
        description: "Pull off the gray base cap while the pen is locked. Do not put it back on.",
        warning: "Do not touch the needle. Use pen within 5 minutes after removing cap.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:66d7adbb-0a6a-4cbe-a622-2e305f2136b3/as/injection_step_2.avif?assetname=injection_step_2.png&width=1200&format=avif"
      },
      {
        title: "Step 3: Place on Skin and Unlock",
        description: "Place the clear base flat on your skin, then turn the lock ring to unlock.",
        warning: "Do not press the button until the base is flat on skin and unlocked.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:7248da27-e860-4a4f-911e-700f4162987f/as/injection_step_3.avif?assetname=injection_step_3.png&width=1200&format=avif"
      },
      {
        title: "Step 4: Press and Hold the Button",
        description: "Press and hold the button for up to 10 seconds. Listen for the first click (injection started). When you hear the second click, injection is complete.",
        warning: "Do not lift until you hear the second click. Check gray plunger is visible.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:ad1c3410-ec02-447b-8f83-e9ac5eb1741e/as/injection_step_4.avif?assetname=injection_step_4.png&width=1200&format=avif"
      }
    ];

    let currentStep = 0;
    let steps = defaultSteps;
    let videoUrl = "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4";
    let instructionsUrl = "https://uspl.lilly.com/zepbound/zepbound.html#ug";

    // DOM elements
    const stepContent = document.getElementById('step-content');
    const stepIndicator = document.getElementById('step-indicator');
    const progressFill = document.getElementById('progress-fill');
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const medicineName = document.getElementById('medicine-name');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const navigation = document.getElementById('navigation');
    const videoSection = document.getElementById('video-section');

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
        // Show video section on completion
        videoSection.classList.remove('hidden');
        return;
      }

      // Hide video section during steps
      videoSection.classList.add('hidden');

      const step = steps[currentStep];
      // Use image if available and not empty, otherwise show step number
      const hasImage = step.image && step.image.trim() !== '';
      const fallbackHtml = \`<div class="step-number-fallback" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9333ea;"><span style="font-size:48px;font-weight:bold;">\${currentStep + 1}</span><span style="font-size:14px;color:#6b7280;margin-top:8px;">\${step.title}</span></div>\`;
      const visualContent = hasImage 
        ? \`<img src="\${step.image}" alt="\${step.title}" style="max-width:100%; max-height:100%; object-fit:contain; border-radius:8px;" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" /><div class="step-number-fallback" style="display:none;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#9333ea;"><span style="font-size:48px;font-weight:bold;">\${currentStep + 1}</span><span style="font-size:14px;color:#6b7280;margin-top:8px;">\${step.title}</span></div>\`
        : fallbackHtml;
      
      stepContent.innerHTML = \`
        <h2 class="step-title">\${step.title}</h2>
        <div class="step-visual">
          \${visualContent}
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

    // Video modal elements
    const videoModal = document.getElementById('video-modal');
    const videoPlayer = document.getElementById('video-player');
    const videoSource = document.getElementById('video-source');
    const videoCloseBtn = document.getElementById('video-close');

    // Open video in modal
    watchVideoBtn.addEventListener('click', () => {
      videoSource.src = videoUrl;
      videoPlayer.load();
      videoModal.classList.add('active');
      videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
    });

    // Close video modal
    videoCloseBtn.addEventListener('click', () => {
      videoModal.classList.remove('active');
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
    });

    // Close modal on backdrop click
    videoModal.addEventListener('click', (e) => {
      if (e.target === videoModal) {
        videoModal.classList.remove('active');
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
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
      if (out.instructionsUrl) {
        instructionsUrl = out.instructionsUrl;
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
            connect_domains: [
              'https://delivery-p137454-e1438138.adobeaemcloud.com',
              'https://uspl.lilly.com',
              'https://pi.lilly.com'
            ],
            resource_domains: [
              'https://medicine-carousel.onrender.com',
              'https://upload.wikimedia.org',
              'https://delivery-p137454-e1438138.adobeaemcloud.com',
              'https://*.adobeaemcloud.com',
              'https://uspl.lilly.com',
              'https://pi.lilly.com'
            ],
            media_domains: [
              'https://delivery-p137454-e1438138.adobeaemcloud.com',
              'https://*.adobeaemcloud.com'
            ]
          }
        }
      }
    ]
  })
);


// Troubleshooting Widget Resource
server.registerResource(
  'troubleshooting-widget-dynamic',
  'ui://widget/troubleshooting-widget-dynamic-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://troubleshooting-widget.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://uspl.lilly.com',
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => {
    // Default troubleshooting data (Zepbound) - will be replaced dynamically by tool
    const defaultTroubleshootingData = TROUBLESHOOTING_DATA['p1'];
    
    return {
      contents: [
        {
          uri: 'ui://widget/troubleshooting-widget-dynamic-v1.html',
          mimeType: 'text/html+skybridge',
          text: createTroubleshootingWidgetHTML(defaultTroubleshootingData),
          _meta: {
            'openai/widgetDomain': 'https://troubleshooting-widget.onrender.com',
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [
                'https://delivery-p137454-e1438138.adobeaemcloud.com',
                'https://uspl.lilly.com',
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

// Interactive Device Troubleshooting Widget Resource
server.registerResource(
  'interactive-troubleshooting-dynamic',
  'ui://widget/interactive-troubleshooting-dynamic-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://interactive-troubleshooting.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://delivery-p137454-e1438138.adobeaemcloud.com',
          'https://uspl.lilly.com',
          'https://upload.wikimedia.org',
          'https://logosandtypes.com'
        ]
      }
    }
  },
  async () => {
    // Default flow (Zepbound pen clicking issue)
    const defaultFlow = DEVICE_TROUBLESHOOTING_FLOWS['zepbound-pen-not-clicking'];
    
    return {
      contents: [
        {
          uri: 'ui://widget/interactive-troubleshooting-dynamic-v1.html',
          mimeType: 'text/html+skybridge',
          text: createInteractiveTroubleshootingWidgetHTML(defaultFlow),
          _meta: {
            'openai/widgetDomain': 'https://interactive-troubleshooting.onrender.com',
            'openai/widgetCSP': {
              connect_domains: [],
              resource_domains: [
                'https://delivery-p137454-e1438138.adobeaemcloud.com',
                'https://uspl.lilly.com',
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

// Product Support Widget Resource
server.registerResource(
  'product-support-widget',
  'ui://widget/product-support-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://product-support.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: [
          'https://qa.unex.lilly.com',
          'https://www.lilly.com',
          'https://www.lillycares.com',
          'https://www.insulinaffordability.com'
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
              connect_domains: [],
              resource_domains: [
                'https://qa.unex.lilly.com',
                'https://www.lilly.com',
                'https://www.lillycares.com',
                'https://www.insulinaffordability.com'
              ]
            }
          }
        },
      ]
    };
  }
);


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
• **Interactive Device Troubleshooting** — Get guided step-by-step help for device issues (e.g., pen not clicking or not working), with the option to report a product quality issue.
• **Product Support** — Get contact information, FAQs, and helpful resources for your Lilly products.

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
      'openai/outputTemplate': 'ui://widget/lilly-direct-store-v1.html',
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
 * Tool: Show Injection Training
 * Displays injection instructions with optional training video for first-time users.
 * Transitions from instruction completion to video player within the same widget.
 * Tracks user's first-time status and video viewing history.
 */

/**
 * Tool: Show Troubleshooting Guide
 * Displays comprehensive troubleshooting information for common medication issues.
 * Includes common problems, side effects, emergency contacts, and when to seek help.
 * Interactive widget with tabs for different types of issues.
 */
server.registerTool(
  'show-troubleshooting-guide',
  {
    title: 'Show Troubleshooting Guide',
    description: 'Display troubleshooting guide with common issues, side effects, and emergency information for a specific medicine',
    _meta: {
      'openai/outputTemplate': 'ui://widget/troubleshooting-widget-dynamic-v1.html',
      'openai/toolInvocation/invoking': 'Loading troubleshooting guide...',
      'openai/toolInvocation/invoked': 'Troubleshooting guide loaded successfully',
      'securitySchemes': [
        { type: 'noauth' },
        { type: 'oauth2', scopes: ['openid', 'profile'] }
      ]
    },
    inputSchema: {
      medicineName: z.string().describe('Name of the medicine for troubleshooting help')
    } as any
  },
  async (args: any) => {
    // Find the medicine
    const medicine = AVAILABLE_MEDICINES.find(med => 
      med.name.toLowerCase().includes(args.medicineName.toLowerCase())
    );
    
    if (!medicine) {
      return {
        content: [
          { 
            type: 'text' as const, 
            text: `Troubleshooting guide not found for "${args.medicineName}". Available medicines: ${AVAILABLE_MEDICINES.map(m => m.name).join(', ')}`
          }
        ],
        structuredContent: { error: 'Medicine not found', medicineName: args.medicineName }
      };
    }

    // Get troubleshooting data
    const troubleshootingData = TROUBLESHOOTING_DATA[medicine.id];
    if (!troubleshootingData) {
      return {
        content: [
          { 
            type: 'text' as const, 
            text: `Troubleshooting guide not yet available for ${medicine.name}. Please contact Lilly support at 1-800-LillyRx for assistance.`
          }
        ],
        structuredContent: { error: 'Troubleshooting data not available', medicineName: medicine.name }
      };
    }

    console.log(`🩺 Troubleshooting guide request for ${medicine.name}`);

    // Create dynamic troubleshooting widget
    const troubleshootingHTML = createTroubleshootingWidgetHTML(troubleshootingData);
    
    const dynamicResource = {
      uri: 'ui://widget/troubleshooting-widget-dynamic-v1.html',
      mimeType: 'text/html+skybridge',
      text: troubleshootingHTML
    };

    return {
      content: [
        { 
          type: 'text' as const, 
          text: `${medicine.name} troubleshooting guide loaded. Find solutions for common issues, side effects management, and emergency contacts.`
        }
      ],
      structuredContent: troubleshootingData,
      _meta: {
        'openai/dynamicContent': dynamicResource
      }
    };
  }
);

/**
 * Tool: Interactive Device Troubleshooting
 * Provides step-by-step guided troubleshooting for device issues like "pen not clicking".
 * Uses Yes/No buttons for guided flow and can escalate to product quality complaint form.
 * Designed for Maya's scenario where she reports pen clicking issues.
 */
server.registerTool(
  'interactive-device-troubleshooting',
  {
    title: 'Interactive Device Troubleshooting',
    description: 'Guided step-by-step troubleshooting for medication device issues with product quality reporting',
    _meta: {
      'openai/outputTemplate': 'ui://widget/interactive-troubleshooting-dynamic-v1.html',
      'openai/toolInvocation/invoking': 'Starting device troubleshooting...',
      'openai/toolInvocation/invoked': 'Interactive troubleshooting loaded successfully',
      'securitySchemes': [
        { type: 'noauth' },
        { type: 'oauth2', scopes: ['openid', 'profile'] }
      ]
    },
    inputSchema: {
      medicineOrIssue: z.string().describe('Medicine name or description of device issue (e.g., "Zepbound pen not clicking", "Humalog pen not working")')
    } as any
  },
  async (args: any) => {
    const issueDescription = args.medicineOrIssue.toLowerCase();
    
    // Determine which troubleshooting flow to use based on the issue
    let flowKey = null;
    let medicine = null;
    
    // Check for specific device issues
    if (issueDescription.includes('zepbound') && (issueDescription.includes('click') || issueDescription.includes('pen'))) {
      flowKey = 'zepbound-pen-not-clicking';
      medicine = AVAILABLE_MEDICINES.find(m => m.id === 'p1');
    } else if (issueDescription.includes('humalog') && issueDescription.includes('pen')) {
      flowKey = 'humalog-pen-not-working';
      medicine = AVAILABLE_MEDICINES.find(m => m.id === 'p2');
    } else {
      // Try to find medicine by name and default to pen issues
      medicine = AVAILABLE_MEDICINES.find(med => 
        issueDescription.includes(med.name.toLowerCase())
      );
      
      if (medicine && medicine.id === 'p1') {
        flowKey = 'zepbound-pen-not-clicking';
      } else if (medicine && medicine.id === 'p2') {
        flowKey = 'humalog-pen-not-working';
      }
    }
    
    if (!flowKey || !medicine) {
      return {
        content: [
          { 
            type: 'text' as const, 
            text: `I couldn't find a specific troubleshooting flow for "${args.medicineOrIssue}". Available troubleshooting: Zepbound pen issues, Humalog pen issues. Please be more specific about the device problem you're experiencing.`
          }
        ],
        structuredContent: { 
          error: 'Troubleshooting flow not found', 
          availableFlows: Object.keys(DEVICE_TROUBLESHOOTING_FLOWS),
          suggestion: 'Try: "Zepbound pen not clicking" or "Humalog pen not working"'
        }
      };
    }

    const troubleshootingFlow = DEVICE_TROUBLESHOOTING_FLOWS[flowKey];
    
    console.log(`🔧 Interactive troubleshooting started for: ${troubleshootingFlow.medicineName} - ${troubleshootingFlow.issueType}`);

    // Create dynamic interactive troubleshooting widget
    const interactiveTroubleshootingHTML = createInteractiveTroubleshootingWidgetHTML(troubleshootingFlow);
    
    const dynamicResource = {
      uri: 'ui://widget/interactive-troubleshooting-dynamic-v1.html',
      mimeType: 'text/html+skybridge',
      text: interactiveTroubleshootingHTML
    };

    return {
      content: [
        { 
          type: 'text' as const, 
          text: `Starting guided troubleshooting for your ${troubleshootingFlow.deviceName}. I'll walk you through step-by-step checks with simple Yes/No questions. If needed, we can submit a product quality report at the end.`
        }
      ],
      structuredContent: troubleshootingFlow,
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
 * Tool: Product Support
 * Shows product support resources with three tabs: Contact Us, FAQ, and Resources.
 * Provides contact information, frequently asked questions, and helpful links.
 * No authentication required - accessible to all users.
 * 
 * Triggered when a user asks:
 * - Product support
 * - Help with my product
 * - Contact Lilly
 * - Customer support
 * - FAQ / Frequently asked questions
 * - How to contact customer service
 */
server.registerTool(
  'product-support',
  {
    title: 'Product Support',
    description: 'Shows product support resources including contact information, FAQs, and helpful resources. Use this when a user needs help with their Lilly products, wants to contact customer support, has questions about their medication, or needs support resources.',
    _meta: {
      'openai/outputTemplate': 'ui://widget/product-support-v1.html',
      'openai/toolInvocation/invoking': 'Loading product support resources...',
      'openai/toolInvocation/invoked': 'Product support resources loaded successfully',
      'securitySchemes': [
        { type: 'noauth' }
      ]
    },
    inputSchema: {}
  },
  async () => {
    console.log('🛟 Product Support tool invoked');
    
    // Create dynamic product support widget
    const productSupportHTML = createProductSupportWidgetHTML();
    
    const dynamicResource = {
      uri: 'ui://widget/product-support-v1.html',
      mimeType: 'text/html+skybridge',
      text: productSupportHTML
    };

    return {
      content: [
        { 
          type: 'text' as const, 
          text: 'Here are the product support resources for Lilly medications. You can find contact information, frequently asked questions, and helpful resources in the tabs above.'
        }
      ],
      structuredContent: {
        supportType: 'product-support',
        tabs: ['Contact Us', 'FAQ', 'Resources'],
        contactPhone: '1-800-LillyRx (1-800-545-5979)',
        hours: 'Mon-Fri: 8AM - 8PM ET'
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