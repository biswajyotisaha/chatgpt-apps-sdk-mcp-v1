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
      background: white;
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
    .header-text {
      text-align: center;
      color: #374151;
      margin-bottom: 20px;
      font-weight: 500;
      font-size: 18px;
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
      align-items: flex-start;
      gap: 20px;
    }
    .product-image-container {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 250px;
      max-height: 300px;
      overflow: hidden;
      align-self: center;
    }
    .product-image {
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
    }
    .medicine-name {
      font-size: 24px;
      font-weight: 600;
      color: #1f2937;
      text-align: left;
      align-self: center;
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
  </style>
</head>
<body>
  <div class="carousel-container">
    <div class="header-text">Buy medicines online from Lilly Direct</div>
    <div class="carousel-wrapper">
      <div class="carousel-track" id="carousel-track">
        ${medicines.map(medicine => `
          <div class="medicine-tile">
            <div class="product-image-container">
              <img src="${medicine.image}" alt="${medicine.name}" class="product-image" crossorigin="anonymous" referrerpolicy="no-referrer">
            </div>
            <div class="medicine-name">${medicine.name}</div>
            <a href="${medicine.buyLink}" target="_blank" class="buy-button">
              ${medicine.buyLinkText}
            </a>
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
 * Creates an interactive support page with three tabs matching the Lilly product help page:
 * - Product support: For product issues and questions
 * - Shipping-related issues: For delivery/handling concerns
 * - Report a possible side effect: For reporting side effects
 * 
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
function createProductSupportWidgetHTML(embeddedProfile?: any): string {
  const profileJSON = embeddedProfile ? JSON.stringify(embeddedProfile).replace(/</g, '\\u003c').replace(/>/g, '\\u003e') : 'null';
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; media-src 'self' https://appssdk.s3.eu-north-1.amazonaws.com blob: data:; img-src 'self' https://appssdk.s3.eu-north-1.amazonaws.com data:; connect-src 'self' https://gifthealth.zendesk.com https://val-safety-reporting-public.lilly.com;">
  <title>Product Support - Lilly</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      background: #f3f4f6;
      color: #1f2937;
      line-height: 1.6;
      padding: 24px;
    }
    
    .widget-container { 
      width: 100%; 
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
      overflow: hidden;
      border: 1px solid #e5e7eb;
    }
    
    .widget-header {
      background: white;
      padding: 32px;
      text-align: left;
    }
    
    .eyebrow {
      font-size: 14px;
      color: #dc2626;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 12px;
    }
    
    .widget-header h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.2;
    }
    
    .widget-header .subtitle {
      font-size: 18px;
      color: #6b7280;
      line-height: 1.5;
    }
    
    .content-area {
      padding: 0 32px 32px;
    }
    
    .tab-navigation {
      display: flex;
      margin-bottom: 32px;
      overflow-x: auto;
      gap: 8px;
      padding-bottom: 4px;
    }
    
    .tab-button {
      background: transparent;
      border: 1px solid #d1d5db;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 30px;
      transition: all 0.2s;
      white-space: nowrap;
      color: #1f2937;
    }
    
    .tab-button:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }
    
    .tab-button.active {
      color: white;
      background: #dc2626;
      border-color: #dc2626;
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
    
    .tab-layout {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 40px;
      align-items: start;
    }
    
    @media (max-width: 768px) {
      .tab-layout {
        grid-template-columns: 1fr;
      }
    }
    
    .tab-image {
      width: 100%;
      border-radius: 12px;
      object-fit: cover;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    
    .tab-text h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .tab-text .bold-text {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .tab-text p {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 16px;
      line-height: 1.6;
    }
    
    .tab-text .small-text {
      font-size: 14px;
      color: #6b7280;
      margin-bottom: 24px;
    }
    
    .action-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      color: #dc2626;
      padding: 12px 0;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }
    
    .action-button:hover {
      color: #b91c1c;
      text-decoration: underline;
    }
    
    .action-button svg {
      transition: transform 0.2s;
    }
    
    .action-button:hover svg {
      transform: translateX(4px);
    }
    
    .section-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 24px 0;
    }
    
    /* Navigation Buttons */
    .nav-buttons {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 24px 0;
      margin-top: 32px;
      margin-bottom: 8px;
      border-top: 1px solid #e5e7eb;
    }
    
    .nav-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 28px;
      font-size: 16px;
      font-weight: 600;
      text-decoration: none;
      border-radius: 30px;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }
    
    .nav-button.back {
      background: transparent;
      color: #dc2626;
    }
    
    .nav-button.back:hover {
      text-decoration: underline;
    }
    
    .nav-button.continue {
      background: #dc2626;
      color: white;
    }
    
    .nav-button.continue:hover {
      background: #b91c1c;
    }
    
    .nav-button svg {
      transition: transform 0.2s;
    }
    
    .nav-button.continue:hover svg {
      transform: translateX(4px);
    }
    
    .nav-button.back:hover svg {
      transform: translateX(-4px);
    }
    
    /* Before We Begin Page */
    .page-view {
      display: none;
    }
    
    .page-view.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }
    
    .before-begin-content h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      font-family: Georgia, 'Times New Roman', serif;
      margin-bottom: 24px;
    }
    
    .before-begin-content h2 {
      font-size: 24px;
      font-weight: 700;
      color: #1f2937;
      font-family: Georgia, 'Times New Roman', serif;
      margin-bottom: 16px;
    }
    
    .before-begin-content h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .before-begin-content p {
      font-size: 18px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .before-begin-content ul {
      list-style: disc;
      padding-left: 24px;
      margin-bottom: 24px;
    }
    
    .before-begin-content li {
      font-size: 18px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 8px;
    }
    
    .sub-section {
      margin-top: 32px;
    }
    
    .resources-section {
      margin-top: 32px;
    }
    
    .resources-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
      margin-top: 16px;
    }
    
    @media (max-width: 640px) {
      .resources-grid {
        grid-template-columns: 1fr;
      }
    }
    
    .resource-column a {
      display: block;
      margin-bottom: 12px;
      text-decoration: none;
      transition: all 0.2s;
    }
    
    .resource-column a.primary-link {
      font-size: 18px;
      font-weight: 700;
      color: #dc2626;
      margin-bottom: 16px;
    }
    
    .resource-column a.secondary-link {
      font-size: 16px;
      color: #dc2626;
    }
    
    .resource-column a:hover {
      text-decoration: underline;
    }
    
    .thick-divider {
      height: 3px;
      background: #e5e7eb;
      margin: 32px 0;
    }
    
    /* Progress Bar */
    .progress-section {
      margin-bottom: 32px;
    }
    
    .progress-label {
      font-size: 14px;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 12px;
    }
    
    .progress-bar {
      display: flex;
      gap: 8px;
    }
    
    .progress-step {
      flex: 1;
      height: 6px;
      background: #e5e7eb;
      border-radius: 3px;
    }
    
    .progress-step.active {
      background: #dc2626;
    }
    
    .progress-labels {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }
    
    .progress-labels span {
      flex: 1;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
      line-height: 1.3;
    }
    
    .progress-labels span.active {
      color: #dc2626;
      font-weight: 600;
    }
    
    /* Product Info Page */
    .product-info-content h1 {
      font-size: 32px;
      font-weight: 700;
      color: #1f2937;
      font-family: Georgia, 'Times New Roman', serif;
      margin-bottom: 16px;
    }
    
    .product-info-content .subtitle {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 32px;
    }
    
    .info-section {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 32px;
      align-items: start;
      margin-bottom: 32px;
      padding: 24px;
      background: #f9fafb;
      border-radius: 12px;
    }
    
    .info-section.no-product-section {
      display: block;
    }
    
    @media (max-width: 768px) {
      .info-section {
        grid-template-columns: 1fr;
      }
    }
    
    .info-content h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 12px;
    }
    
    .info-content p {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .info-image img {
      max-width: 100%;
      height: auto;
    }
    
    .batch-input-row {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    
    .batch-input {
      flex: 1;
      padding: 14px 16px;
      font-size: 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      outline: none;
      transition: border-color 0.2s;
    }
    
    .batch-input:focus {
      border-color: #dc2626;
    }
    
    .batch-submit-btn {
      width: 52px;
      height: 52px;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    }
    
    .batch-submit-btn:hover {
      background: #b91c1c;
    }
    
    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 14px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      border: none;
    }
    
    .action-btn.filled {
      background: #dc2626;
      color: white;
    }
    
    .action-btn.filled:hover {
      background: #b91c1c;
    }
    
    /* Alert Box */
    .alert-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    
    .alert-box p {
      font-size: 16px;
      color: #991b1b;
      margin: 0;
    }
    
    /* Selection Chips */
    .form-section {
      margin-bottom: 24px;
    }
    
    .form-label {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 12px;
      display: block;
    }
    
    .selection-chips {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .selection-chip {
      padding: 12px 24px;
      border: 2px solid #d1d5db;
      border-radius: 30px;
      background: white;
      font-size: 16px;
      font-weight: 500;
      color: #4b5563;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .selection-chip:hover {
      border-color: #dc2626;
      color: #dc2626;
    }
    
    .selection-chip.selected {
      border-color: #dc2626;
      background: #dc2626;
      color: white;
    }
    
    .selection-chip:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    /* Radio with Image */
    .radio-options {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
    }
    
    .radio-option {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 2px solid #d1d5db;
      border-radius: 12px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      min-width: 150px;
    }
    
    .radio-option:hover {
      border-color: #dc2626;
    }
    
    .radio-option.selected {
      border-color: #dc2626;
      background: #fef2f2;
    }
    
    .radio-option.disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    
    .radio-option img {
      height: 80px;
      width: auto;
    }
    
    .radio-option label {
      font-size: 16px;
      font-weight: 500;
      color: #1f2937;
    }
    
    /* Select Dropdown */
    .form-select {
      width: 100%;
      max-width: 300px;
      padding: 16px 40px 16px 16px;
      font-size: 16px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      background: white;
      outline: none;
      cursor: pointer;
      transition: border-color 0.2s;
      height: 52px;
      appearance: none;
      -webkit-appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%236b7280' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
    }
    
    .form-select:focus {
      border-color: #dc2626;
    }
    
    .batch-display {
      padding: 14px 16px;
      font-size: 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      background: #f3f4f6;
      color: #6b7280;
      max-width: 300px;
    }
    
    .nav-button.continue:disabled {
      background: #fecaca;
      cursor: not-allowed;
    }
    
    /* Expired Product Page */
    .expired-heading {
      font-size: 32px;
      font-weight: 400;
      font-family: Georgia, serif;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .expired-message {
      font-size: 18px;
      color: #4b5563;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    
    .radio-fieldset {
      border: none;
      padding: 0;
      margin: 0 0 32px 0;
    }
    
    .radio-legend {
      font-size: 18px;
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .radio-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .radio-item:hover {
      border-color: #dc2626;
    }
    
    .radio-item.selected {
      border-color: #dc2626;
      background: #fef2f2;
    }
    
    .radio-item input[type="radio"] {
      width: 20px;
      height: 20px;
      accent-color: #dc2626;
    }
    
    .radio-item span {
      font-size: 16px;
      color: #1f2937;
    }
    
    /* Issue Information Page */
    .dropdown-wrapper {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .issue-select {
      width: 100%;
      height: 56px;
      padding: 16px 48px 16px 20px;
      font-size: 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      background: white;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='%23374151' viewBox='0 0 256 256'%3E%3Cpath d='M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z'%3E%3C/path%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 16px center;
      background-size: 20px;
      outline: none;
      cursor: pointer;
      transition: all 0.2s;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
      color: #1f2937;
    }
    
    .issue-select:hover {
      border-color: #9ca3af;
    }
    
    .issue-select:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
    
    .issue-select:disabled {
      background-color: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
    
    .issue-select option {
      padding: 12px;
    }
    
    /* Expired Product Messages */
    .expired-message-box {
      display: none;
      padding: 20px;
      border-radius: 8px;
      margin-top: 24px;
      margin-bottom: 24px;
    }
    
    .expired-message-box.error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
    }
    
    .expired-message-box.info {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-left: 4px solid #22c55e;
    }
    
    .expired-message-box.active {
      display: block;
    }
    
    .expired-message-box h3 {
      font-size: 16px;
      font-weight: 700;
      color: #991b1b;
      margin: 0 0 8px 0;
    }
    
    .expired-message-box.info h3 {
      color: #166534;
    }
    
    .expired-message-box p {
      font-size: 16px;
      color: #991b1b;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }
    
    .expired-message-box.info p {
      color: #166534;
    }
    
    .expired-action-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 30px;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    
    .expired-action-btn.safety {
      background: #dc2626;
      color: white;
      border: none;
    }
    
    .expired-action-btn.safety:hover {
      background: #b91c1c;
    }
    
    .expired-action-btn.continue {
      background: #dc2626;
      color: white;
      border: none;
    }
    
    .expired-action-btn.continue:hover {
      background: #b91c1c;
    }
    
    /* Questions Page Styles */
    .questions-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 24px;
      margin-bottom: 24px;
      padding-bottom: 24px;
      border-bottom: 1.5px solid #e5e7eb;
    }
    
    .questions-header-text h1 {
      font-size: 28px;
      font-weight: 400;
      font-family: Georgia, serif;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .questions-header-text p {
      font-size: 16px;
      color: #4b5563;
      margin: 0;
    }
    
    .questions-header-image {
      flex-shrink: 0;
    }
    
    .questions-header-image img {
      width: 120px;
      height: auto;
    }
    
    .questions-wrapper {
      margin-bottom: 24px;
    }
    
    .fields-required {
      font-size: 16px;
      color: #4b5563;
      margin-bottom: 24px;
    }
    
    .question-group {
      margin-bottom: 24px;
    }
    
    .question-label {
      display: block;
      font-size: 16px;
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .question-radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .question-radio-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .question-radio-item:hover:not(.disabled) {
      border-color: #dc2626;
    }
    
    .question-radio-item.selected {
      border-color: #dc2626;
      background: #fef2f2;
    }
    
    .question-radio-item.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: #f9fafb;
    }
    
    .question-radio-item input[type="radio"] {
      width: 18px;
      height: 18px;
      accent-color: #dc2626;
      margin: 0;
    }
    
    .question-radio-item label {
      font-size: 16px;
      color: #1f2937;
      cursor: pointer;
      flex: 1;
    }
    
    .question-radio-item.disabled label {
      cursor: not-allowed;
    }
    
    .confirmation-section {
      background: #f9fafb;
      padding: 24px;
      border-radius: 12px;
      margin-top: 24px;
    }
    
    .confirmation-section h2 {
      font-size: 20px;
      font-weight: 600;
      color: #1f2937;
      margin: 0 0 12px 0;
    }
    
    .confirmation-section p {
      font-size: 14px;
      color: #4b5563;
      line-height: 1.6;
      margin: 0 0 12px 0;
    }
    
    .confirmation-section a {
      color: #dc2626;
      text-decoration: underline;
    }
    
    /* Your Information Page Styles */
    .your-info-header {
      margin-bottom: 16px;
    }
    
    .your-info-header h1 {
      font-size: 32px;
      font-weight: 400;
      font-family: Georgia, serif;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .your-info-header p {
      font-size: 16px;
      color: #4b5563;
      margin: 0;
    }
    
    .info-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-left: 4px solid #dc2626;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .info-alert svg {
      flex-shrink: 0;
      color: #dc2626;
    }
    
    .info-alert p {
      font-size: 14px;
      color: #991b1b;
      margin: 0;
    }
    
    .info-alert strong {
      font-weight: 700;
    }
    
    .form-grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    
    .form-row.single {
      grid-template-columns: 1fr;
    }
    
    .form-field {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    
    .form-field label {
      font-size: 14px;
      font-weight: 500;
      color: #374151;
    }
    
    .form-field input,
    .form-field select {
      padding: 14px 16px;
      font-size: 16px;
      border: 1px solid #d1d5db;
      border-radius: 12px;
      outline: none;
      transition: all 0.2s;
    }
    
    .form-field input:focus,
    .form-field select:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }
    
    .form-field input:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
    
    .form-field input::placeholder {
      color: #9ca3af;
    }
    
    .permission-question {
      margin-bottom: 24px;
    }
    
    .permission-question .question-label {
      font-size: 16px;
      font-weight: 500;
      color: #1f2937;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .address-section {
      margin-top: 24px;
    }
    
    .address-section-title {
      font-size: 16px;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 16px;
    }
    
    .device-return-question {
      margin-top: 24px;
    }
    
    .device-return-question .hint-text {
      font-size: 14px;
      color: #6b7280;
      font-style: italic;
      margin-top: 4px;
    }
    
    /* Report Submitted Page Styles */
    .report-submitted-header {
      margin-bottom: 24px;
    }
    
    .report-submitted-header h1 {
      font-size: 48px;
      font-weight: 400;
      font-family: Georgia, serif;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .report-submitted-header h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    
    .report-submitted-header p {
      font-size: 18px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .report-submitted-header ul {
      font-size: 18px;
      color: #4b5563;
      line-height: 1.8;
      margin: 16px 0 24px 24px;
      padding: 0;
    }
    
    .report-submitted-header ul li {
      margin-bottom: 8px;
    }
    
    .resources-section {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 32px;
      margin: 32px 0;
    }
    
    .resources-section h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 8px 0;
    }
    
    .resources-section p {
      font-size: 16px;
      color: #4b5563;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    
    .resource-links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 32px;
    }
    
    .resource-links a {
      color: #dc2626;
      font-size: 16px;
      text-decoration: none;
      font-weight: 500;
    }
    
    .resource-links a:hover {
      text-decoration: underline;
    }
    
    .resource-divider {
      height: 2px;
      background: #e5e7eb;
      margin: 32px 0;
      border: none;
    }
    
    .additional-resources h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0 0 16px 0;
    }
    
    .product-links-container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 32px;
    }
    
    .product-link-column {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .product-link-column .primary-link {
      font-size: 18px;
      font-weight: 600;
      color: #dc2626;
      text-decoration: none;
      margin-bottom: 8px;
    }
    
    .product-link-column .primary-link:hover {
      text-decoration: underline;
    }
    
    .product-link-column .secondary-link {
      font-size: 14px;
      color: #4b5563;
      text-decoration: none;
    }
    
    .product-link-column .secondary-link:hover {
      text-decoration: underline;
    }
    
    .take-home-button {
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: background 0.2s;
    }
    
    .take-home-button:hover {
      background: #b91c1c;
    }
    
    /* Review Report Page Styles */
    .review-card {
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      margin-bottom: 20px;
      overflow: hidden;
    }
    
    .review-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 24px;
    }
    
    .review-card-header h6 {
      font-size: 16px;
      font-weight: 700;
      color: #1f2937;
      margin: 0;
    }
    
    .review-card-header .edit-link {
      color: #dc2626;
      font-size: 16px;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
    }
    
    .review-card-header .edit-link:hover {
      text-decoration: underline;
    }
    
    .review-card-divider {
      height: 1px;
      background: #e5e7eb;
      margin: 0;
      border: none;
    }
    
    .review-card-content {
      padding: 20px 24px;
    }
    
    .review-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    
    .review-grid-item dt {
      font-size: 12px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }
    
    .review-grid-item dd {
      font-size: 16px;
      color: #1f2937;
      margin: 0;
    }
    
    .review-alert {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-left: 4px solid #3b82f6;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    
    .review-alert svg {
      flex-shrink: 0;
      color: #3b82f6;
      margin-top: 2px;
    }
    
    .review-alert p {
      font-size: 15px;
      color: #1e40af;
      margin: 0;
      line-height: 1.5;
    }
    
    .confirmation-section-review {
      margin-top: 32px;
    }
    
    .confirmation-section-review h2 {
      font-size: 28px;
      font-weight: 400;
      font-family: Georgia, serif;
      color: #1f2937;
      margin-bottom: 20px;
    }
    
    .confirm-checkbox-group {
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    }
    
    .confirm-checkbox-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      cursor: pointer;
    }
    
    .confirm-checkbox-item input[type="checkbox"] {
      width: 20px;
      height: 20px;
      margin-top: 2px;
      flex-shrink: 0;
      accent-color: #dc2626;
      cursor: pointer;
    }
    
    .confirm-checkbox-item label {
      font-size: 16px;
      color: #1f2937;
      line-height: 1.5;
      cursor: pointer;
    }
    
    .confirm-checkbox-item label a {
      color: #dc2626;
      text-decoration: none;
    }
    
    .confirm-checkbox-item label a:hover {
      text-decoration: underline;
    }
    
    .privacy-text {
      font-size: 15px;
      color: #4b5563;
      line-height: 1.7;
      margin-bottom: 24px;
    }
    
    .privacy-text a {
      color: #dc2626;
      text-decoration: none;
    }
    
    .privacy-text a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="widget-container">
    <div class="widget-header">
      <p class="eyebrow">Product support</p>
      <h1>Have an issue with your medicine? We're here to help.</h1>
      <p class="subtitle">Get help with your Mounjaro® (tirzepatide) or Zepbound® (tirzepatide) product here. Select your concern below.</p>
    </div>
    
    <div class="content-area">
      <div class="tab-navigation">
        <button class="tab-button active" onclick="showTab('product-support')">Product support</button>
        <button class="tab-button" onclick="showTab('shipping-issues')">Shipping-related issues</button>
        <button class="tab-button" onclick="showTab('side-effects')">Report a possible side effect</button>
      </div>
      
      <!-- Product Support Tab -->
      <div id="product-support" class="tab-content active">
        <div class="tab-layout">
          <div class="tab-image-container">
            <img src="https://appssdk.s3.eu-north-1.amazonaws.com/product-support.jpeg" alt="Product Support" class="tab-image">
          </div>
          <div class="tab-text">
            <h2>Product Support</h2>
            <p class="bold-text">For issues and questions related to Mounjaro® (tirzepatide), or Zepbound® (tirzepatide) products</p>
            <p>If something doesn't seem right with your product or you have questions, we're here to help. Our team can look into concerns related to quality, usability, appearance, or safety. If you need support with your Lilly product, connect with us below.</p>
            <p class="small-text">Please report per local country requirements. Visit a region or country specific Lilly-owned site via the globe icon in the menu for more information.</p>
            <button type="button" class="action-button" onclick="showPage('before-we-begin')">
              Get product support
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Shipping-related Issues Tab -->
      <div id="shipping-issues" class="tab-content">
        <div class="tab-layout">
          <div class="tab-image-container">
            <img src="https://appssdk.s3.eu-north-1.amazonaws.com/shipping-issues.jpeg" alt="Shipping Issues" class="tab-image">
          </div>
          <div class="tab-text">
            <h2>Shipping-related issues</h2>
            <p>These are concerns you may experience during delivery or handling of your medicine. For example, problems with temperature, damaged containers, or missed or lost shipments.</p>
            
            <div class="section-divider"></div>
            
            <p class="bold-text">Pen or KwikPen shipping issues</p>
            <p>For concerns related to the shipping of your pen or KwikPen, reach out to your dispensing pharmacy for help.</p>
            
            <div class="section-divider"></div>
            
            <p class="bold-text">Vial and/or syringe shipping issues</p>
            <p>For concerns related to the shipping of your vial, contact Gifthealth below.</p>
            <a href="https://gifthealth.zendesk.com/hc/en-us/categories/28401912557211-LillyDirect-Zepbound" target="_blank" class="action-button">
              Contact Gifthealth
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
      
      <!-- Report Side Effects Tab -->
      <div id="side-effects" class="tab-content">
        <div class="tab-layout">
          <div class="tab-image-container">
            <img src="https://appssdk.s3.eu-north-1.amazonaws.com/side-effects.jpeg" alt="Report Side Effects" class="tab-image">
          </div>
          <div class="tab-text">
            <h2>Report a possible side effect</h2>
            <p>Side effect(s) are any undesirable or unintended experience associated with the use of a medicinal product in a patient.</p>
            <p>If you're experiencing a side effect after or while using a Lilly medicine — such as a new or unexpected symptom — you can report it here. Sharing this information helps us monitor the safety of our products.</p>
            <a href="https://val-safety-reporting-public.lilly.com" target="_blank" class="action-button">
              Report a Lilly safety concern
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Before We Begin Page -->
  <div id="before-we-begin" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area before-begin-content">
        <h1>Before we begin...</h1>
        <p>Please have your product and its packaging ready. This tool is intended for self-reports only and may be used by U.S. residents who are 18 years or older. If you are submitting a report on someone else's behalf, please use the <a href="https://val-safety-reporting-public.lilly.com" target="_blank" style="color: #dc2626; text-decoration: underline;">Lilly Safety Reporting Tool.</a></p>
        
        <div class="sub-section">
          <h2>Helpful information to gather</h2>
          <p>Please note that our ability to assist may be limited without the following information:</p>
          <ul>
            <li>Medication package with 2D barcode or valid lot number/batch number (your pharmacy can provide the lot number if you don't have it available)</li>
            <li>Product strength and dosing information</li>
            <li>Description of the device issue or quality concern</li>
            <li>Your contact information that matches the prescription</li>
          </ul>
        </div>
        
        <div class="sub-section">
          <h2>Supported medications</h2>
          <p>If you do not see your medication below, use the <a href="https://val-safety-reporting-public.lilly.com" target="_blank" style="color: #dc2626; text-decoration: underline;">Lilly Safety Reporting Tool</a> instead of this form.</p>
          <ul>
            <li>Mounjaro® (tirzepatide) pens</li>
            <li>Zepbound® (tirzepatide) pens and KwikPens</li>
          </ul>
        </div>
        
        <div class="nav-buttons">
          <button class="nav-button back" onclick="showPage('main')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
            </svg>
            Go back
          </button>
          <button class="nav-button continue" onclick="showPage('product-info')">
            Continue
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Product Information Page -->
  <div id="product-info" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step"></div>
            <div class="progress-step"></div>
            <div class="progress-step"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span>Issue information</span>
            <span>Your information</span>
            <span>Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <h1>Product information</h1>
          <p class="subtitle">To verify product authenticity we will need your lot/batch number.</p>
          
          <!-- Individual Product Section -->
          <div class="info-section">
            <div class="info-content">
              <h6>If you have your individual product</h6>
              <p>Enter the lot/batch number found on the pen or bottle label, located just above the expiration date.</p>
              <div class="batch-input-row">
                <input type="text" id="batchNumber" placeholder="Lot/batch number" maxlength="15" class="batch-input" />
                <button type="button" class="batch-submit-btn" onclick="submitBatchNumber()">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
                    <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
                  </svg>
                </button>
              </div>
            </div>
            <div class="info-image">
              <img src="https://appssdk.s3.eu-north-1.amazonaws.com/lot-batch-number-example-aq_6iK29.svg" alt="Lot batch number example" />
            </div>
          </div>
          
          <!-- No Product Section -->
          <div class="info-section no-product-section">
            <h6>If you do not have the individual product or medicine package</h6>
            <p>Please contact your dispensing pharmacy for the lot/batch number. You may continue without the lot/batch number, but you will not be eligible for replacement product.</p>
            
            <label class="disclaimer-checkbox" style="display: flex; align-items: flex-start; gap: 12px; margin: 24px 0 20px 0; cursor: pointer;">
              <input type="checkbox" id="noProductCheckbox" onchange="updateContinueWithoutBatch()" style="width: 20px; height: 20px; margin-top: 2px; flex-shrink: 0; accent-color: #dc2626; cursor: pointer;">
              <span style="font-size: 14px; color: #4b5563; line-height: 1.5;">I understand that support is limited if I don't scan or provide product information when submitting this form</span>
            </label>
            
            <button type="button" class="action-btn filled" id="continueWithoutBatchBtn" disabled onclick="continueWithoutBatch()" style="opacity: 0.5; pointer-events: none;">
              Continue without lot/batch number
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
          
          <div class="thick-divider"></div>
          
          <div class="nav-buttons" style="justify-content: flex-start;">
            <button class="nav-button back" onclick="showPage('before-we-begin')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Product Details Page -->
  <div id="product-details" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step"></div>
            <div class="progress-step"></div>
            <div class="progress-step"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span>Issue information</span>
            <span>Your information</span>
            <span>Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <h1>Product details</h1>
          
          <!-- Alert Box -->
          <div class="alert-box">
            <p><strong>Please Note:</strong> Confirm that the information below is correct as the information from the barcode scan did not match a Lilly product. When you submit, Lilly will verify product authenticity.</p>
          </div>
          
          <!-- Batch Number Display -->
          <div class="form-section">
            <label class="form-label">Lot/Batch number</label>
            <div class="batch-display" id="displayBatchNumber">-</div>
          </div>
          
          <!-- Product Name Selection -->
          <div class="form-section">
            <label class="form-label">Product name</label>
            <div class="selection-chips">
              <button type="button" class="selection-chip" data-product="mounjaro" onclick="selectProduct('mounjaro')">Mounjaro</button>
              <button type="button" class="selection-chip" data-product="zepbound" onclick="selectProduct('zepbound')">Zepbound</button>
            </div>
          </div>
          
          <!-- Product Type Selection -->
          <div class="form-section">
            <label class="form-label">Product type</label>
            <div class="radio-options" id="productTypeOptions">
              <div class="radio-option disabled" data-type="pen" onclick="selectProductType('pen')">
                <img src="https://appssdk.s3.eu-north-1.amazonaws.com/zepbound-auto-injector-C38U2n85.svg" alt="Pen" />
                <label>Pen</label>
              </div>
              <div class="radio-option disabled" data-type="kwikpen" onclick="selectProductType('kwikpen')">
                <img src="https://appssdk.s3.eu-north-1.amazonaws.com/zepbound-kwikpen-CcXeYcHn.svg" alt="KwikPen" />
                <label>KwikPen</label>
              </div>
            </div>
          </div>
          
          <!-- Strength Dropdown -->
          <div class="form-section">
            <label class="form-label">Strength</label>
            <select class="form-select" id="strengthSelect" disabled onchange="updateStrength()">
              <option value="">Select strength</option>
              <option value="2.5">2.5 mg</option>
              <option value="5">5 mg</option>
              <option value="7.5">7.5 mg</option>
              <option value="10">10 mg</option>
              <option value="12.5">12.5 mg</option>
              <option value="15">15 mg</option>
            </select>
          </div>
          
          <div class="thick-divider"></div>
          
          <div class="nav-buttons">
            <button class="nav-button back" onclick="showPage('product-info')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
            <button class="nav-button continue" id="continueBtn" disabled onclick="continueToNextStep()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Expired Product Page -->
  <div id="expired-product" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <div class="product-info-content">
          <h1 class="expired-heading">Expired product</h1>
          <p class="expired-message">It appears that your medicine is expired, please answer the below question to know how to best proceed.</p>
          
          <fieldset class="radio-fieldset">
            <legend class="radio-legend">Did you take the medication already?</legend>
            <div class="radio-group">
              <label class="radio-item" onclick="selectExpiredAnswer('yes')">
                <input type="radio" name="expired-medication" value="yes" />
                <span>Yes</span>
              </label>
              <label class="radio-item" onclick="selectExpiredAnswer('no')">
                <input type="radio" name="expired-medication" value="no" />
                <span>No</span>
              </label>
            </div>
          </fieldset>
          
          <!-- Error message for YES -->
          <div id="expiredYesMessage" class="expired-message-box error">
            <h3>Action needed:</h3>
            <p>If you have taken the expired medication, please report this on Lilly Safety Reporting Tool.</p>
            <a href="https://val-safety-reporting-public.lilly.com" target="_blank" class="expired-action-btn safety">
              Report a Lilly safety concern
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </a>
          </div>
          
          <!-- Warning message for NO -->
          <div id="expiredNoMessage" class="expired-message-box error">
            <h3>Warning:</h3>
            <p>Do not take expired product. If you were issued expired product, contact your distributing pharmacy for help.</p>
            <button type="button" class="expired-action-btn continue" onclick="showPage('issue-info')">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-button back" onclick="showPage('product-details')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Issue Information Page -->
  <div id="issue-info" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step"></div>
            <div class="progress-step"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span class="active">Issue information</span>
            <span>Your information</span>
            <span>Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <h1>Tell us what happened</h1>
          <p class="subtitle">Please select your issue type followed by your product concern. Your selections will help us understand what went wrong and how to help.</p>
          
          <div class="dropdown-wrapper">
            <div class="form-section">
              <label class="form-label">Issue type</label>
              <select class="issue-select" id="issueTypeSelect" onchange="updateIssueType()">
                <option value="">Select issue type</option>
                <option value="pen_issue">Pen Issue</option>
                <option value="needle_issue">Needle Issue</option>
                <option value="packaging_issue">Packaging Issue</option>
                <option value="experience_not_captured">Experience not captured</option>
              </select>
            </div>
            
            <div class="form-section">
              <label class="form-label">Product concern</label>
              <select class="issue-select" id="productConcernSelect" disabled onchange="updateProductConcern()">
                <option value="">Select product concern</option>
              </select>
            </div>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-button back" onclick="showPage('expired-product')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
            <button class="nav-button continue" id="issueContinueBtn" disabled onclick="continueFromIssue()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Questions Page -->
  <div id="questions-page" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span class="active">Issue information</span>
            <span class="active">Your information</span>
            <span>Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <!-- Questions Header -->
          <div class="questions-header">
            <div class="questions-header-text">
              <h1 id="questionsTitle">Questions</h1>
              <p>Please answer the question(s) below to help us better understand your concern.</p>
            </div>
            <div class="questions-header-image">
              <img src="https://appssdk.s3.eu-north-1.amazonaws.com/pen_diagram-C3cm34AE.svg" alt="Product Diagram" onerror="this.style.display='none'">
            </div>
          </div>
          
          <!-- Questions Wrapper -->
          <div class="questions-wrapper">
            <p class="fields-required">All fields required unless otherwise indicated</p>
            <div id="questionsContainer">
              <!-- Questions will be dynamically rendered here -->
            </div>
          </div>
          
          <!-- Confirmation Section -->
          <div class="confirmation-section">
            <h2>Confirmation</h2>
            <p>Once you submit, your answers can't be changed. Please review all your answers before submitting.</p>
            <p>Eli Lilly and Company has legal obligations to record and/or report adverse events and product complaints. Your personal information will be processed in accordance with specific pharmacovigilance legislation. We will process the information that you provide for purposes such as responding and following up on your inquiry, storing the information for reference and complying with our legal and regulatory recording and reporting obligations. By clicking "Submit" you agree to our <a href="https://privacynotice.lilly.com/" target="_blank" rel="noopener noreferrer">Privacy Statement</a> and <a href="https://www.lillyhub.com/legal/lillyusa/chpn.html" target="_blank" rel="noopener noreferrer">Consumer Health Privacy Notice</a>.</p>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-button back" onclick="showPage('issue-info')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
            <button class="nav-button continue" id="questionsContinueBtn" disabled onclick="continueFromQuestions()">
              Continue
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Your Information Page -->
  <div id="your-info" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span class="active">Issue information</span>
            <span class="active">Your information</span>
            <span>Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <!-- Your Information Header -->
          <div class="your-info-header">
            <h1>Your Information</h1>
            <p>Please provide your contact information so we can follow up with you about your concern.</p>
          </div>
          
          <!-- Error Alert -->
          <div class="info-alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 256 256">
              <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm-4,48a12,12,0,1,1-12,12A12,12,0,0,1,124,72Zm12,112a16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40a8,8,0,0,1,0,16Z"></path>
            </svg>
            <p><strong>Important:</strong> Please ensure all information is accurate. We will use this information to contact you about your product concern.</p>
          </div>
          
          <!-- Form Fields -->
          <div class="form-grid">
            <div class="form-row">
              <div class="form-field">
                <label for="firstName">First name *</label>
                <input type="text" id="firstName" placeholder="Enter first name" oninput="userInfo.firstName = this.value; updateUserInfoContinueButton()">
              </div>
              <div class="form-field">
                <label for="lastName">Last name *</label>
                <input type="text" id="lastName" placeholder="Enter last name" oninput="userInfo.lastName = this.value; updateUserInfoContinueButton()">
              </div>
            </div>
            
            <div class="form-row single">
              <div class="form-field">
                <label for="dateOfBirth">Date of birth *</label>
                <input type="date" id="dateOfBirth" oninput="userInfo.dateOfBirth = this.value; updateUserInfoContinueButton()">
              </div>
            </div>
            
            <!-- Permission to Contact -->
            <div class="permission-question">
              <span class="question-label">May we contact you for additional information? *</span>
              <div class="question-radio-group">
                <div class="question-radio-item" data-value="yes" onclick="selectPermissionToContact('yes')">
                  <input type="radio" name="permissionToContact" id="permission-yes" value="yes">
                  <label for="permission-yes">Yes</label>
                </div>
                <div class="question-radio-item" data-value="no" onclick="selectPermissionToContact('no')">
                  <input type="radio" name="permissionToContact" id="permission-no" value="no">
                  <label for="permission-no">No</label>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-field">
                <label for="email">Email address</label>
                <input type="email" id="email" placeholder="Enter email" disabled oninput="userInfo.email = this.value; updateUserInfoContinueButton()">
              </div>
              <div class="form-field">
                <label for="phone">Phone number</label>
                <input type="tel" id="phone" placeholder="Enter phone number" disabled oninput="userInfo.phone = this.value; updateUserInfoContinueButton()">
              </div>
            </div>
            
            <!-- Address Section -->
            <div class="address-section">
              <h3 class="address-section-title">Address</h3>
              
              <div class="form-row single">
                <div class="form-field">
                  <label for="address">Street address *</label>
                  <input type="text" id="address" placeholder="Enter street address" oninput="userInfo.address = this.value; updateUserInfoContinueButton()">
                </div>
              </div>
              
              <div class="form-row single">
                <div class="form-field">
                  <label for="apartment">Apartment, suite, etc. (optional)</label>
                  <input type="text" id="apartment" placeholder="Enter apartment, suite, etc." oninput="userInfo.apartment = this.value">
                </div>
              </div>
              
              <div class="form-row">
                <div class="form-field">
                  <label for="city">City *</label>
                  <input type="text" id="city" placeholder="Enter city" oninput="userInfo.city = this.value; updateUserInfoContinueButton()">
                </div>
                <div class="form-field">
                  <label for="state">State *</label>
                  <select id="state" onchange="userInfo.state = this.value; updateUserInfoContinueButton()">
                    <option value="">Select state</option>
                    <option value="AL">Alabama</option>
                    <option value="AK">Alaska</option>
                    <option value="AZ">Arizona</option>
                    <option value="AR">Arkansas</option>
                    <option value="CA">California</option>
                    <option value="CO">Colorado</option>
                    <option value="CT">Connecticut</option>
                    <option value="DE">Delaware</option>
                    <option value="FL">Florida</option>
                    <option value="GA">Georgia</option>
                    <option value="HI">Hawaii</option>
                    <option value="ID">Idaho</option>
                    <option value="IL">Illinois</option>
                    <option value="IN">Indiana</option>
                    <option value="IA">Iowa</option>
                    <option value="KS">Kansas</option>
                    <option value="KY">Kentucky</option>
                    <option value="LA">Louisiana</option>
                    <option value="ME">Maine</option>
                    <option value="MD">Maryland</option>
                    <option value="MA">Massachusetts</option>
                    <option value="MI">Michigan</option>
                    <option value="MN">Minnesota</option>
                    <option value="MS">Mississippi</option>
                    <option value="MO">Missouri</option>
                    <option value="MT">Montana</option>
                    <option value="NE">Nebraska</option>
                    <option value="NV">Nevada</option>
                    <option value="NH">New Hampshire</option>
                    <option value="NJ">New Jersey</option>
                    <option value="NM">New Mexico</option>
                    <option value="NY">New York</option>
                    <option value="NC">North Carolina</option>
                    <option value="ND">North Dakota</option>
                    <option value="OH">Ohio</option>
                    <option value="OK">Oklahoma</option>
                    <option value="OR">Oregon</option>
                    <option value="PA">Pennsylvania</option>
                    <option value="RI">Rhode Island</option>
                    <option value="SC">South Carolina</option>
                    <option value="SD">South Dakota</option>
                    <option value="TN">Tennessee</option>
                    <option value="TX">Texas</option>
                    <option value="UT">Utah</option>
                    <option value="VT">Vermont</option>
                    <option value="VA">Virginia</option>
                    <option value="WA">Washington</option>
                    <option value="WV">West Virginia</option>
                    <option value="WI">Wisconsin</option>
                    <option value="WY">Wyoming</option>
                  </select>
                </div>
              </div>
              
              <div class="form-row single">
                <div class="form-field">
                  <label for="zipCode">ZIP code *</label>
                  <input type="text" id="zipCode" placeholder="Enter ZIP code" oninput="userInfo.zipCode = this.value; updateUserInfoContinueButton()">
                </div>
              </div>
            </div>
            
            <!-- Device Return Question -->
            <div class="device-return-question">
              <span class="question-label">Would you be willing to return the device for evaluation? *</span>
              <p class="hint-text">Returning the device helps us investigate and improve our products.</p>
              <div class="question-radio-group">
                <div class="question-radio-item" data-value="yes" onclick="selectDeviceReturn('yes')">
                  <input type="radio" name="deviceReturn" id="device-yes" value="yes">
                  <label for="device-yes">Yes</label>
                </div>
                <div class="question-radio-item" data-value="no" onclick="selectDeviceReturn('no')">
                  <input type="radio" name="deviceReturn" id="device-no" value="no">
                  <label for="device-no">No</label>
                </div>
              </div>
            </div>
          </div>
          
          <div class="nav-buttons">
            <button class="nav-button back" onclick="showPage('questions-page')">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
              </svg>
              Go back
            </button>
            <button class="nav-button continue" id="yourInfoContinueBtn" onclick="submitReport()">
              Review your report
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Review Report Page -->
  <div id="review-report" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="progress-bar-container">
            <div class="progress-bar" style="width: 100%"></div>
          </div>
          <div class="step-labels">
            <span>Product information</span>
            <span>Issue information</span>
            <span>Your information</span>
            <span class="active-step">Report &amp; submit</span>
          </div>
        </div>
        
        <h1 style="font-size: 28px; font-weight: 400; font-family: Georgia, serif; color: #1f2937; margin-bottom: 8px;">Review your report</h1>
        
        <div class="review-alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
            <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm16-40a8,8,0,0,1-8,8,16,16,0,0,1-16-16V128a8,8,0,0,1,0-16,16,16,0,0,1,16,16v40A8,8,0,0,1,144,176ZM112,84a12,12,0,1,1,12,12A12,12,0,0,1,112,84Z"></path>
          </svg>
          <p>Please review the information below before submitting your report. Click &quot;Edit&quot; to make changes to any section.</p>
        </div>
        
        <!-- Product Information Card -->
        <div class="review-card">
          <div class="review-card-header">
            <h6>Product information</h6>
            <a class="edit-link" onclick="showPage('product-info')">Edit</a>
          </div>
          <hr class="review-card-divider">
          <div class="review-card-content">
            <dl class="review-grid" id="review-product-grid">
              <!-- Populated by JS -->
            </dl>
          </div>
        </div>
        
        <!-- Issue Information Card -->
        <div class="review-card">
          <div class="review-card-header">
            <h6>Issue information</h6>
            <a class="edit-link" onclick="showPage('issue-info')">Edit</a>
          </div>
          <hr class="review-card-divider">
          <div class="review-card-content">
            <dl class="review-grid" id="review-issue-grid">
              <!-- Populated by JS -->
            </dl>
          </div>
        </div>
        
        <!-- Your Information Card -->
        <div class="review-card">
          <div class="review-card-header">
            <h6>Your information</h6>
            <a class="edit-link" onclick="showPage('your-info')">Edit</a>
          </div>
          <hr class="review-card-divider">
          <div class="review-card-content">
            <dl class="review-grid" id="review-user-grid">
              <!-- Populated by JS -->
            </dl>
          </div>
        </div>
        
        <!-- Confirmation Section -->
        <div class="confirmation-section-review">
          <h2>Confirm and submit</h2>
          <div class="confirm-checkbox-group">
            <div class="confirm-checkbox-item">
              <input type="checkbox" id="confirm-accuracy" onchange="updateReviewSubmitButton()">
              <label for="confirm-accuracy">I confirm that the information provided is accurate to the best of my knowledge.</label>
            </div>
            <div class="confirm-checkbox-item">
              <input type="checkbox" id="confirm-resident" onchange="updateReviewSubmitButton()">
              <label for="confirm-resident">I confirm that I am a US resident aged 18 or older.</label>
            </div>
            <div class="confirm-checkbox-item">
              <input type="checkbox" id="confirm-product" onchange="updateReviewSubmitButton()">
              <label for="confirm-product">I confirm that I am filing a report for a Mounjaro, Zepbound, or Orforglipron product made by Eli Lilly.</label>
            </div>
          </div>
          
          <p class="privacy-text">
            By submitting this report, you agree to our <a href="#">Privacy Policy</a> and acknowledge that the information provided will be used to investigate product quality concerns. Eli Lilly may contact you for additional details regarding your report.
          </p>
        </div>
        
        <div class="nav-buttons">
          <button class="nav-button back" onclick="showPage('your-info')">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,128a12,12,0,0,1-12,12H69l51.52,51.51a12,12,0,0,1-17,17l-72-72a12,12,0,0,1,0-17l72-72a12,12,0,0,1,17,17L69,116H212A12,12,0,0,1,224,128Z"></path>
            </svg>
            Go back
          </button>
          <button class="nav-button continue" id="reviewSubmitBtn" disabled onclick="finalSubmit()">
            Submit report
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Report Submitted Page -->
  <div id="report-submitted" class="page-view">
    <div class="widget-container" style="display: block;">
      <div class="content-area">
        <!-- Progress Bar -->
        <div class="progress-section">
          <p class="progress-label">Your progress</p>
          <div class="progress-bar">
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
            <div class="progress-step active"></div>
          </div>
          <div class="progress-labels">
            <span class="active">Product information</span>
            <span class="active">Issue information</span>
            <span class="active">Your information</span>
            <span class="active">Report &amp; submit</span>
          </div>
        </div>
        
        <div class="product-info-content">
          <!-- Report Submitted Header -->
          <div class="report-submitted-header">
            <h1>Report submitted</h1>
            <h6>Confirmation: <span id="confirmationNumber">LY-020926-035200</span></h6>
            <p>Thank you for your feedback, your concern has been submitted. However, we're currently unable to offer full support for your request due to one or more of the following:</p>
            <ul>
              <li>A valid lot or batch number was not provided.</li>
              <li>The product appears to be a sample, which is not eligible for replacement.</li>
              <li>Contact information was not provided (report submitted anonymously).</li>
            </ul>
            <p>Thank you for your understanding. If you decide to share this information later, we'll be better able to assist you.</p>
          </div>
          
          <!-- Resources Section -->
          <div class="resources-section">
            <div>
              <h6>Review our training resources</h6>
              <p>Whether you're new to injections or have been using them for a while, take a moment to review our How to Use videos. They can help you feel more confident and avoid issues in the future.</p>
              <div class="resource-links">
                <a href="https://www.mounjaro.com/how-to-take" target="_blank">See how to use Mounjaro® (tirzepatide)</a>
                <a href="https://www.zepbound.com/how-to-take" target="_blank">See how to use Zepbound® (tirzepatide)</a>
              </div>
            </div>
            
            <hr class="resource-divider">
            
            <div class="additional-resources">
              <h6>Additional resources</h6>
              <div class="product-links-container">
                <div class="product-link-column">
                  <a href="https://mounjaro.lilly.com" class="primary-link" target="_blank">Mounjaro</a>
                  <a href="https://uspl.lilly.com/mounjaro/mounjaro.html#pi" class="secondary-link" target="_blank">Prescribing Information with Boxed Warnings</a>
                  <a href="https://uspl.lilly.com/mounjaro/mounjaro.html#mg" class="secondary-link" target="_blank">Medication Guide</a>
                  <a href="https://uspl.lilly.com/mounjaro/mounjaro.html#ug0" class="secondary-link" target="_blank">Instructions for Use - Pen</a>
                </div>
                <div class="product-link-column">
                  <a href="https://zepbound.lilly.com" class="primary-link" target="_blank">Zepbound</a>
                  <a href="https://uspl.lilly.com/zepbound/zepbound.html#pi" class="secondary-link" target="_blank">Prescribing Information with Boxed Warnings</a>
                  <a href="https://uspl.lilly.com/zepbound/zepbound.html#mg" class="secondary-link" target="_blank">Medication Guide</a>
                  <a href="https://uspl.lilly.com/zepbound/zepbound.html#ug" class="secondary-link" target="_blank">Instructions for Use - Pen</a>
                  <a href="https://uspl.lilly.com/zepbound/zepbound.html#ug2" class="secondary-link" target="_blank">Instructions for Use - KwikPen</a>
                </div>
              </div>
            </div>
            
            <button class="take-home-button" onclick="showPage('main')">
              Take me home
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                <path d="M224.49,136.49l-72,72a12,12,0,0,1-17-17L187,140H40a12,12,0,0,1,0-24H187L135.51,64.48a12,12,0,0,1,17-17l72,72A12,12,0,0,1,224.49,136.49Z"></path>
              </svg>
            </button>
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
      
      // Update widget state
      if (window.oai && window.oai.widget && typeof window.oai.widget.setState === 'function') {
        window.oai.widget.setState({
          activeTab: tabId,
          viewMode: 'product-support'
        });
      }
    }
    
    function showPage(pageId) {
      // Hide all page views and main container
      document.querySelectorAll('.page-view').forEach(page => {
        page.classList.remove('active');
      });
      
      const mainContainer = document.querySelector('.widget-container');
      const allPages = ['before-we-begin', 'product-info', 'product-details', 'expired-product', 'issue-info', 'questions-page', 'your-info', 'review-report', 'report-submitted'];
      
      if (pageId === 'main') {
        // Show main product support view
        mainContainer.style.display = 'block';
        allPages.forEach(p => {
          const el = document.getElementById(p);
          if (el) el.classList.remove('active');
        });
      } else {
        // Hide main container and show specific page
        mainContainer.style.display = 'none';
        allPages.forEach(p => {
          const el = document.getElementById(p);
          if (el) {
            if (p === pageId) {
              el.classList.add('active');
            } else {
              el.classList.remove('active');
            }
          }
        });
      }
    }
    
    // Product Details form state
    let formState = {
      batchNumber: '',
      productName: '',
      productType: '',
      strength: ''
    };
    
    function submitBatchNumber() {
      const batchNumber = document.getElementById('batchNumber').value;
      if (batchNumber.trim()) {
        formState.batchNumber = batchNumber.trim();
        formState.hasBatchNumber = true;
        document.getElementById('displayBatchNumber').textContent = formState.batchNumber;
        showPage('product-details');
        // Auto-select Zepbound and Pen when batch number is entered
        setTimeout(function() {
          selectProduct('zepbound');
          selectProductType('pen');
        }, 100);
      } else {
        alert('Please enter a lot/batch number');
      }
    }
    
    function selectProduct(product) {
      formState.productName = product;
      
      // Update chip selection
      document.querySelectorAll('.selection-chip').forEach(chip => {
        chip.classList.remove('selected');
      });
      document.querySelector('[data-product="' + product + '"]').classList.add('selected');
      
      // Enable product type options
      document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('disabled');
      });
      
      // Reset product type and strength when product changes
      formState.productType = '';
      formState.strength = '';
      document.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
      document.getElementById('strengthSelect').value = '';
      document.getElementById('strengthSelect').disabled = true;
      
      updateContinueButton();
    }
    
    function selectProductType(type) {
      if (formState.productName === '') {
        alert('Please select a product name first');
        return;
      }
      
      formState.productType = type;
      
      // Update radio option selection
      document.querySelectorAll('.radio-option').forEach(option => {
        option.classList.remove('selected');
      });
      document.querySelector('[data-type="' + type + '"]').classList.add('selected');
      
      // Enable strength dropdown
      document.getElementById('strengthSelect').disabled = false;
      
      updateContinueButton();
    }
    
    function updateStrength() {
      formState.strength = document.getElementById('strengthSelect').value;
      updateContinueButton();
    }
    
    function updateContinueButton() {
      const continueBtn = document.getElementById('continueBtn');
      if (formState.productName && formState.productType && formState.strength) {
        continueBtn.disabled = false;
      } else {
        continueBtn.disabled = true;
      }
    }
    
    function continueToNextStep() {
      console.log('Form submitted:', formState);
      showPage('expired-product');
    }
    
    // Expired Product Page functions
    let expiredAnswer = '';
    
    function selectExpiredAnswer(answer) {
      expiredAnswer = answer;
      document.querySelectorAll('#expired-product .radio-item').forEach(item => {
        item.classList.remove('selected');
      });
      event.currentTarget.classList.add('selected');
      
      // Hide both messages first
      document.getElementById('expiredYesMessage').classList.remove('active');
      document.getElementById('expiredNoMessage').classList.remove('active');
      
      // Show appropriate message based on selection
      if (answer === 'yes') {
        document.getElementById('expiredYesMessage').classList.add('active');
      } else if (answer === 'no') {
        document.getElementById('expiredNoMessage').classList.add('active');
      }
    }
    
    // Issue Information Page functions
    const issueOptions = {
      pen_issue: [
        { value: 'base_cap', label: 'Base cap' },
        { value: 'medicine_leaked', label: 'Medicine leaked' },
        { value: 'needle_issue', label: 'Needle issue' },
        { value: 'dose_window', label: 'Dose window issue' },
        { value: 'pen_did_not_work', label: 'Pen did not work' },
        { value: 'pen_jammed', label: 'Pen jammed' },
        { value: 'other_pen_issue', label: 'Other pen issue' }
      ],
      needle_issue: [
        { value: 'needle_bent', label: 'Needle bent' },
        { value: 'needle_missing', label: 'Needle missing' },
        { value: 'needle_contaminated', label: 'Needle contaminated' },
        { value: 'other_needle_issue', label: 'Other needle issue' }
      ],
      packaging_issue: [
        { value: 'carton_damaged', label: 'Carton Damaged' },
        { value: 'missing_items', label: 'Missing items' },
        { value: 'wrong_product', label: 'Wrong product' },
        { value: 'other_packaging_issue', label: 'Other packaging issue' }
      ],
      experience_not_captured: [
        { value: 'side_effect', label: 'Side effect' },
        { value: 'unexpected_reaction', label: 'Unexpected reaction' },
        { value: 'no_effect', label: 'No effect' },
        { value: 'other_experience', label: 'Other experience' }
      ]
    };
    
    // Question configurations based on issue type and product concern
    const questionConfigs = {
      'pen_issue_base_cap': {
        title: 'Pen Issue: Base cap',
        questions: [
          {
            id: 'dsh0001-1',
            text: 'I attempted to complete my injection without removing the base cap',
            options: ['Yes', 'No'],
            disablesOthersOnYes: true
          },
          {
            id: 'dsh0001-2',
            text: 'If you answered no to the first question, was the base cap difficult to remove or were you unable to remove it?',
            options: ['Yes', 'No', 'N/A'],
            dependsOnFirst: true
          },
          {
            id: 'dsh0001-3',
            text: 'If you answered no to the first question, did part of the base cap remain covering the needle?',
            options: ['Yes', 'No', 'N/A'],
            dependsOnFirst: true
          }
        ]
      },
      'pen_issue_medicine_leaked': {
        title: 'Pen Issue: Medicine leaked',
        questions: [
          {
            id: 'dsh0003-1',
            text: 'Which of these did you observe?',
            options: ['Medicine leaked from the needle when you removed the base cap', 'Medicine leaked from the needle while pen was placed against the skin', 'Medicine leaked from the needle after removing pen away from skin'],
            enablesSpecificQuestions: true
          },
          {
            id: 'dsh0003-2',
            text: 'If Medicine leaked from the needle after removing pen away from skin, were 2 clicks heard during the injection?',
            options: ['Yes', 'No', "I don't remember"],
            enabledByOption: 2
          },
          {
            id: 'dsh0003-3',
            text: 'If medicine leaked from the needle when you removed the base cap, did you unlock the pen before removing the base cap?',
            options: ['Yes', 'No', "I don't remember"],
            enabledByOption: 0
          },
          {
            id: 'dsh0003-4',
            text: 'Is the gray plunger visible?',
            options: ['Yes', 'No', "I don't remember"],
            alwaysEnabled: true
          }
        ]
      },
      'packaging_issue_carton_damaged': {
        title: 'Packaging Issue: Carton Damaged',
        questions: [
          {
            id: 'dsh0006-1',
            text: 'Was the carton sealed?',
            options: ['Yes', 'No', "I don't remember"],
            alwaysEnabled: true
          }
        ]
      }
    };
    
    let issueState = {
      issueType: '',
      productConcern: '',
      questionAnswers: {}
    };
    
    function updateIssueType() {
      const issueType = document.getElementById('issueTypeSelect').value;
      issueState.issueType = issueType;
      issueState.productConcern = '';
      
      const concernSelect = document.getElementById('productConcernSelect');
      concernSelect.innerHTML = '<option value="">Select product concern</option>';
      
      if (issueType && issueOptions[issueType]) {
        issueOptions[issueType].forEach(optionObj => {
          const opt = document.createElement('option');
          opt.value = optionObj.value;
          opt.textContent = optionObj.label;
          concernSelect.appendChild(opt);
        });
        concernSelect.disabled = false;
      } else {
        concernSelect.disabled = true;
      }
      
      updateIssueContinueButton();
    }
    
    function updateProductConcern() {
      issueState.productConcern = document.getElementById('productConcernSelect').value;
      updateIssueContinueButton();
    }
    
    function updateIssueContinueButton() {
      const continueBtn = document.getElementById('issueContinueBtn');
      if (issueState.issueType && issueState.productConcern) {
        continueBtn.disabled = false;
      } else {
        continueBtn.disabled = true;
      }
    }
    
    function continueFromIssue() {
      console.log('Issue submitted:', issueState);
      // Build the config key (e.g., 'pen_issue_base_cap')
      const configKey = issueState.issueType + '_' + issueState.productConcern;
      
      // Check if there's a question config for this combination
      if (questionConfigs[configKey]) {
        renderQuestionsPage(questionConfigs[configKey]);
        showPage('questions-page');
      } else {
        // If no specific questions, go directly to Your Information
        showPage('your-info');
        loadUserProfile();
      }
    }
    
    function renderQuestionsPage(config) {
      const questionsContainer = document.getElementById('questionsContainer');
      const questionsTitle = document.getElementById('questionsTitle');
      
      questionsTitle.textContent = config.title;
      questionsContainer.innerHTML = '';
      issueState.questionAnswers = {};
      
      config.questions.forEach((question, qIndex) => {
        const questionGroup = document.createElement('div');
        questionGroup.className = 'question-group';
        questionGroup.id = 'question-' + question.id;
        
        const label = document.createElement('span');
        label.className = 'question-label';
        label.textContent = question.text;
        questionGroup.appendChild(label);
        
        const radioGroup = document.createElement('div');
        radioGroup.className = 'question-radio-group';
        
        question.options.forEach((option, optIndex) => {
          const radioItem = document.createElement('div');
          radioItem.className = 'question-radio-item' + (question.dependsOnFirst || question.enabledByOption !== undefined ? ' disabled' : '');
          radioItem.dataset.questionId = question.id;
          radioItem.dataset.optionIndex = optIndex;
          
          const radio = document.createElement('input');
          radio.type = 'radio';
          radio.name = question.id;
          radio.id = question.id + '-' + optIndex;
          radio.value = option;
          radio.disabled = question.dependsOnFirst || (question.enabledByOption !== undefined && !question.alwaysEnabled);
          
          const radioLabel = document.createElement('label');
          radioLabel.setAttribute('for', question.id + '-' + optIndex);
          radioLabel.textContent = option;
          
          radioItem.appendChild(radio);
          radioItem.appendChild(radioLabel);
          
          radioItem.onclick = function(e) {
            if (radio.disabled) return;
            selectQuestionAnswer(question.id, option, optIndex, config);
          };
          
          radioGroup.appendChild(radioItem);
        });
        
        questionGroup.appendChild(radioGroup);
        questionsContainer.appendChild(questionGroup);
      });
      
      updateQuestionsContinueButton();
    }
    
    function selectQuestionAnswer(questionId, answer, optionIndex, config) {
      issueState.questionAnswers[questionId] = { answer, optionIndex };
      
      // Update selection styling
      const questionGroup = document.getElementById('question-' + questionId);
      questionGroup.querySelectorAll('.question-radio-item').forEach(item => {
        item.classList.remove('selected');
      });
      questionGroup.querySelector('[data-option-index="' + optionIndex + '"]').classList.add('selected');
      questionGroup.querySelector('input[value="' + answer + '"]').checked = true;
      
      // Find the question config
      const questionConfig = config.questions.find(q => q.id === questionId);
      
      // Handle conditional disabling (Pen Issue: Base cap)
      if (questionConfig && questionConfig.disablesOthersOnYes) {
        const dependentQuestions = config.questions.filter(q => q.dependsOnFirst);
        
        if (answer === 'Yes') {
          // Disable subsequent questions and set N/A
          dependentQuestions.forEach(depQ => {
            const depGroup = document.getElementById('question-' + depQ.id);
            depGroup.querySelectorAll('.question-radio-item').forEach(item => {
              item.classList.add('disabled');
              item.classList.remove('selected');
            });
            depGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
              radio.disabled = true;
              radio.checked = false;
            });
            // Auto-select N/A if available
            const naOption = depQ.options.indexOf('N/A');
            if (naOption !== -1) {
              const naItem = depGroup.querySelector('[data-option-index="' + naOption + '"]');
              naItem.classList.add('selected');
              naItem.querySelector('input').checked = true;
              issueState.questionAnswers[depQ.id] = { answer: 'N/A', optionIndex: naOption };
            }
          });
        } else {
          // Enable subsequent questions
          dependentQuestions.forEach(depQ => {
            const depGroup = document.getElementById('question-' + depQ.id);
            depGroup.querySelectorAll('.question-radio-item').forEach(item => {
              item.classList.remove('disabled');
              item.classList.remove('selected');
            });
            depGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
              radio.disabled = false;
              radio.checked = false;
            });
            delete issueState.questionAnswers[depQ.id];
          });
        }
      }
      
      // Handle enablesSpecificQuestions (Medicine leaked)
      if (questionConfig && questionConfig.enablesSpecificQuestions) {
        config.questions.forEach(q => {
          if (q.enabledByOption !== undefined) {
            const depGroup = document.getElementById('question-' + q.id);
            if (optionIndex === q.enabledByOption) {
              // Enable this question
              depGroup.querySelectorAll('.question-radio-item').forEach(item => {
                item.classList.remove('disabled');
              });
              depGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.disabled = false;
              });
            } else {
              // Disable and reset
              depGroup.querySelectorAll('.question-radio-item').forEach(item => {
                item.classList.add('disabled');
                item.classList.remove('selected');
              });
              depGroup.querySelectorAll('input[type="radio"]').forEach(radio => {
                radio.disabled = true;
                radio.checked = false;
              });
              delete issueState.questionAnswers[q.id];
            }
          }
        });
      }
      
      updateQuestionsContinueButton();
    }
    
    function updateQuestionsContinueButton() {
      const continueBtn = document.getElementById('questionsContinueBtn');
      // Get the config key
      const configKey = issueState.issueType + '_' + issueState.productConcern;
      const config = questionConfigs[configKey];
      
      if (!config) {
        continueBtn.disabled = true;
        return;
      }
      
      // Check if all required questions are answered
      let allAnswered = true;
      config.questions.forEach(q => {
        // If question is not disabled, it needs an answer
        const questionGroup = document.getElementById('question-' + q.id);
        const firstRadioItem = questionGroup.querySelector('.question-radio-item');
        const isDisabled = firstRadioItem.classList.contains('disabled');
        
        if (!isDisabled && !issueState.questionAnswers[q.id]) {
          allAnswered = false;
        }
      });
      
      continueBtn.disabled = !allAnswered;
    }
    
    function continueFromQuestions() {
      console.log('Questions submitted:', issueState);
      showPage('your-info');
      loadUserProfile();
    }
    
    // User Information functions
    let userInfo = {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      permissionToContact: '',
      email: '',
      phone: '',
      address: '',
      apartment: '',
      city: '',
      state: '',
      zipCode: '',
      deviceReturn: ''
    };
    
    function loadUserProfile() {
      // Use embedded profile data from server (fetched at tool invocation time)
      var profile = window.__embeddedProfile || null;
      
      if (!profile) {
        console.log('No embedded profile data available');
        return;
      }
      
      // Show loading state briefly
      var loadingMessage = document.createElement('div');
      loadingMessage.id = 'profileLoadingMessage';
      loadingMessage.style.cssText = 'padding: 12px; background: #d1fae5; border-radius: 8px; margin-bottom: 20px; color: #065f46; font-size: 14px;';
      loadingMessage.textContent = '✓ Profile information loaded successfully';
      
      var yourInfoPage = document.getElementById('your-info');
      var formGrid = yourInfoPage.querySelector('.form-grid');
      if (formGrid) {
        formGrid.parentNode.insertBefore(loadingMessage, formGrid);
      }
      
      populateUserInfo(profile);
      window.cachedUserProfile = profile;
      
      setTimeout(function() { loadingMessage.remove(); }, 3000);
    }
    
    function populateUserInfo(profile) {
      if (profile.givenName) {
        document.getElementById('firstName').value = profile.givenName;
        userInfo.firstName = profile.givenName;
      }
      if (profile.familyName) {
        document.getElementById('lastName').value = profile.familyName;
        userInfo.lastName = profile.familyName;
      }
      if (profile.email) {
        document.getElementById('email').value = profile.email;
        userInfo.email = profile.email;
      }
      if (profile.phoneNumber) {
        document.getElementById('phone').value = profile.phoneNumber;
        userInfo.phone = profile.phoneNumber;
      }
      if (profile.dateOfBirth) {
        document.getElementById('dateOfBirth').value = profile.dateOfBirth;
        userInfo.dateOfBirth = profile.dateOfBirth;
      }
      if (profile.address) {
        if (profile.address.street) {
          document.getElementById('address').value = profile.address.street;
          userInfo.address = profile.address.street;
        }
        if (profile.address.city) {
          document.getElementById('city').value = profile.address.city;
          userInfo.city = profile.address.city;
        }
        if (profile.address.state) {
          document.getElementById('state').value = profile.address.state;
          userInfo.state = profile.address.state;
        }
        if (profile.address.zipCode) {
          document.getElementById('zipCode').value = profile.address.zipCode;
          userInfo.zipCode = profile.address.zipCode;
        }
      }
      // Also check primaryResidence (AWS API format)
      var residence = profile.primaryResidence;
      if (residence && typeof residence === 'object') {
        if (residence.address1) {
          document.getElementById('address').value = residence.address1;
          userInfo.address = residence.address1;
        }
        if (residence.address2) {
          document.getElementById('apartment').value = residence.address2;
          userInfo.apartment = residence.address2;
        }
        if (residence.city) {
          document.getElementById('city').value = residence.city;
          userInfo.city = residence.city;
        }
        if (residence.state) {
          document.getElementById('state').value = residence.state;
          userInfo.state = residence.state;
        }
        if (residence.zipCode) {
          document.getElementById('zipCode').value = residence.zipCode;
          userInfo.zipCode = residence.zipCode;
        }
      }
      if (profile.dob && !profile.dateOfBirth) {
        document.getElementById('dateOfBirth').value = profile.dob;
        userInfo.dateOfBirth = profile.dob;
      }
      
      // Trigger validation after populating fields
      updateUserInfoContinueButton();
    }
    
    function selectPermissionToContact(value) {
      userInfo.permissionToContact = value;
      
      document.querySelectorAll('#permissionGroup .question-radio-item').forEach(item => {
        item.classList.remove('selected');
      });
      event.currentTarget.classList.add('selected');
      event.currentTarget.querySelector('input').checked = true;
      
      // Enable/disable contact fields based on selection
      const emailField = document.getElementById('email');
      const phoneField = document.getElementById('phone');
      
      if (value === 'yes') {
        emailField.disabled = false;
        phoneField.disabled = false;
      } else {
        emailField.disabled = true;
        phoneField.disabled = true;
        emailField.value = '';
        phoneField.value = '';
        userInfo.email = '';
        userInfo.phone = '';
      }
      
      updateUserInfoContinueButton();
    }
    
    function selectDeviceReturn(value) {
      userInfo.deviceReturn = value;
      
      document.querySelectorAll('#deviceReturnGroup .question-radio-item').forEach(item => {
        item.classList.remove('selected');
      });
      event.currentTarget.classList.add('selected');
      event.currentTarget.querySelector('input').checked = true;
      
      updateUserInfoContinueButton();
    }
    
    function updateUserInfoContinueButton() {
      const firstName = document.getElementById('firstName').value.trim();
      const lastName = document.getElementById('lastName').value.trim();
      const dateOfBirth = document.getElementById('dateOfBirth').value;
      const address = document.getElementById('address').value.trim();
      const city = document.getElementById('city').value.trim();
      const state = document.getElementById('state').value;
      const zipCode = document.getElementById('zipCode').value.trim();
      
      // Check if permission to contact radio is selected
      const permissionYes = document.getElementById('permission-yes').checked;
      const permissionNo = document.getElementById('permission-no').checked;
      const permissionSelected = permissionYes || permissionNo;
      
      // Check if device return radio is selected
      const deviceYes = document.getElementById('device-yes').checked;
      const deviceNo = document.getElementById('device-no').checked;
      const deviceReturnSelected = deviceYes || deviceNo;
      
      // Check if all required fields are filled
      let allRequiredFilled = firstName && lastName && dateOfBirth && 
                              permissionSelected && address && city && 
                              state && zipCode && deviceReturnSelected;
      
      // If permission to contact is 'yes', email or phone is required
      if (permissionYes) {
        const email = document.getElementById('email').value.trim();
        const phone = document.getElementById('phone').value.trim();
        allRequiredFilled = allRequiredFilled && (email || phone);
      }
      
      const continueBtn = document.getElementById('yourInfoContinueBtn');
      continueBtn.disabled = false;
    }
    
    function submitReport() {
      // Collect all form data
      userInfo.firstName = document.getElementById('firstName').value;
      userInfo.lastName = document.getElementById('lastName').value;
      userInfo.dateOfBirth = document.getElementById('dateOfBirth').value;
      userInfo.email = document.getElementById('email').value;
      userInfo.phone = document.getElementById('phone').value;
      userInfo.address = document.getElementById('address').value;
      userInfo.apartment = document.getElementById('apartment').value;
      userInfo.city = document.getElementById('city').value;
      userInfo.state = document.getElementById('state').value;
      userInfo.zipCode = document.getElementById('zipCode').value;
      
      // Populate review page and show it
      populateReviewPage();
      showPage('review-report');
    }
    
    function populateReviewPage() {
      // Reset confirmation checkboxes
      document.getElementById('confirm-accuracy').checked = false;
      document.getElementById('confirm-resident').checked = false;
      document.getElementById('confirm-product').checked = false;
      updateReviewSubmitButton();
      
      // Product Information card
      var productGrid = document.getElementById('review-product-grid');
      var productHtml = '';
      if (formState.productName) {
        productHtml += '<div class="review-grid-item"><dt>PRODUCT</dt><dd>' + formState.productName + '</dd></div>';
      }
      if (formState.productType) {
        productHtml += '<div class="review-grid-item"><dt>TYPE</dt><dd>' + formState.productType + '</dd></div>';
      }
      if (formState.strength) {
        productHtml += '<div class="review-grid-item"><dt>STRENGTH</dt><dd>' + formState.strength + '</dd></div>';
      }
      if (formState.batchNumber) {
        productHtml += '<div class="review-grid-item"><dt>LOT / BATCH NUMBER</dt><dd>' + formState.batchNumber + '</dd></div>';
      } else {
        productHtml += '<div class="review-grid-item"><dt>LOT / BATCH NUMBER</dt><dd>Not provided</dd></div>';
      }
      productGrid.innerHTML = productHtml;
      
      // Issue Information card
      var issueGrid = document.getElementById('review-issue-grid');
      var issueHtml = '';
      if (issueState.issueType) {
        issueHtml += '<div class="review-grid-item"><dt>ISSUE TYPE</dt><dd>' + issueState.issueType + '</dd></div>';
      }
      if (issueState.productConcern) {
        issueHtml += '<div class="review-grid-item"><dt>PRODUCT CONCERN</dt><dd>' + issueState.productConcern + '</dd></div>';
      }
      if (issueState.questionAnswers) {
        var qaKeys = Object.keys(issueState.questionAnswers);
        for (var i = 0; i < qaKeys.length; i++) {
          var qKey = qaKeys[i];
          var qVal = issueState.questionAnswers[qKey];
          if (qVal) {
            issueHtml += '<div class="review-grid-item"><dt>' + qKey.toUpperCase() + '</dt><dd>' + qVal + '</dd></div>';
          }
        }
      }
      issueGrid.innerHTML = issueHtml;
      
      // Your Information card
      var userGrid = document.getElementById('review-user-grid');
      var userHtml = '';
      var fullName = (userInfo.firstName || '') + ' ' + (userInfo.lastName || '');
      if (fullName.trim()) {
        userHtml += '<div class="review-grid-item"><dt>NAME</dt><dd>' + fullName.trim() + '</dd></div>';
      }
      if (userInfo.dateOfBirth) {
        userHtml += '<div class="review-grid-item"><dt>DATE OF BIRTH</dt><dd>' + userInfo.dateOfBirth + '</dd></div>';
      }
      if (userInfo.email) {
        userHtml += '<div class="review-grid-item"><dt>EMAIL</dt><dd>' + userInfo.email + '</dd></div>';
      }
      if (userInfo.phone) {
        userHtml += '<div class="review-grid-item"><dt>PHONE</dt><dd>' + userInfo.phone + '</dd></div>';
      }
      var fullAddress = '';
      if (userInfo.address) fullAddress += userInfo.address;
      if (userInfo.apartment) fullAddress += ', ' + userInfo.apartment;
      if (fullAddress) {
        userHtml += '<div class="review-grid-item"><dt>ADDRESS</dt><dd>' + fullAddress + '</dd></div>';
      }
      var cityStateZip = '';
      if (userInfo.city) cityStateZip += userInfo.city;
      if (userInfo.state) cityStateZip += ', ' + userInfo.state;
      if (userInfo.zipCode) cityStateZip += ' ' + userInfo.zipCode;
      if (cityStateZip) {
        userHtml += '<div class="review-grid-item"><dt>CITY / STATE / ZIP</dt><dd>' + cityStateZip + '</dd></div>';
      }
      if (userInfo.permissionToContact) {
        userHtml += '<div class="review-grid-item"><dt>PERMISSION TO CONTACT</dt><dd>' + (userInfo.permissionToContact === 'yes' ? 'Yes' : 'No') + '</dd></div>';
      }
      if (userInfo.deviceReturn) {
        userHtml += '<div class="review-grid-item"><dt>WILLING TO RETURN DEVICE</dt><dd>' + (userInfo.deviceReturn === 'yes' ? 'Yes' : 'No') + '</dd></div>';
      }
      userGrid.innerHTML = userHtml;
    }
    
    function updateReviewSubmitButton() {
      var cb1 = document.getElementById('confirm-accuracy').checked;
      var cb2 = document.getElementById('confirm-resident').checked;
      var cb3 = document.getElementById('confirm-product').checked;
      var btn = document.getElementById('reviewSubmitBtn');
      btn.disabled = !(cb1 && cb2 && cb3);
    }
    
    function finalSubmit() {
      // Generate confirmation number
      var today = new Date();
      var dateStr = today.getFullYear().toString().slice(-2) + 
                    String(today.getMonth() + 1).padStart(2, '0') + 
                    String(today.getDate()).padStart(2, '0');
      var randomNum = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
      var confirmationNum = 'LY-' + dateStr + '-' + randomNum;
      
      console.log('Report submitted:', {
        formState: formState,
        issueState: issueState,
        userInfo: userInfo,
        confirmationNumber: confirmationNum
      });
      
      // Show report submitted page
      document.getElementById('confirmationNumber').textContent = confirmationNum;
      showPage('report-submitted');
    }
    
    // Allow ChatGPT to set user profile data
    window.setUserProfile = function(profile) {
      window.cachedUserProfile = profile;
      if (document.getElementById('your-info').classList.contains('active')) {
        populateUserInfo(profile);
      }
    };
    
    function scanBarcode() {
      alert('Barcode scanning feature coming soon!');
    }
    
    function updateContinueWithoutBatch() {
      const checkbox = document.getElementById('noProductCheckbox');
      const btn = document.getElementById('continueWithoutBatchBtn');
      if (checkbox.checked) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.5';
        btn.style.pointerEvents = 'none';
      }
    }
    
    function continueWithoutBatch() {
      formState.batchNumber = '';
      formState.hasBatchNumber = false;
      document.getElementById('displayBatchNumber').textContent = 'Not provided';
      showPage('product-details');
    }
    
    // Update the Get product support button to navigate to before-we-begin page
    document.addEventListener('DOMContentLoaded', function() {
      const productSupportBtn = document.querySelector('#product-support .action-button');
      if (productSupportBtn) {
        productSupportBtn.addEventListener('click', function(e) {
          e.preventDefault();
          showPage('before-we-begin');
        });
      }
    });
    
    // Embedded profile data from server
    window.__embeddedProfile = ${profileJSON};
    
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
        connect_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com',
          'https://gifthealth.zendesk.com',
          'https://val-safety-reporting-public.lilly.com'
        ],
        resource_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com',
          'https://gifthealth.zendesk.com',
          'https://val-safety-reporting-public.lilly.com'
        ],
        media_domains: [
          'https://appssdk.s3.eu-north-1.amazonaws.com'
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
              connect_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com',
                'https://gifthealth.zendesk.com',
                'https://val-safety-reporting-public.lilly.com'
              ],
              resource_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com',
                'https://gifthealth.zendesk.com',
                'https://val-safety-reporting-public.lilly.com'
              ],
              media_domains: [
                'https://appssdk.s3.eu-north-1.amazonaws.com'
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
• **Product Support** — Get help with Mounjaro or Zepbound product issues, shipping problems, or report a side effect.

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
 * Shows product support resources with three tabs matching the Lilly product help page:
 * - Product support: For product issues and questions
 * - Shipping-related issues: For delivery/handling concerns  
 * - Report a possible side effect: For reporting side effects
 * No authentication required - accessible to all users.
 * 
 * Triggered when a user asks:
 * - Product support / Product help
 * - Issue with my medicine / Issue with my product
 * - Shipping problem / Shipping issue / Delivery issue
 * - Report side effect / Side effects
 * - Problem with my Mounjaro / Zepbound
 * - Help with my medication
 * - Contact Lilly about product
 */
server.registerTool(
  'product-support',
  {
    title: 'Product Support',
    description: 'Shows product support resources for Mounjaro and Zepbound medications. Use this when a user has an issue with their medicine, needs product support, has shipping problems, wants to report a side effect, or needs help with their Lilly product. Covers product quality concerns, shipping/delivery issues, and side effect reporting.',
    _meta: {
      'openai/outputTemplate': 'ui://widget/product-support-v1.html',
      'openai/toolInvocation/invoking': 'Loading product support resources...',
      'openai/toolInvocation/invoked': 'Product support resources loaded successfully'
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