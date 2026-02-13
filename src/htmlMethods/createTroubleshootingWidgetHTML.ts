import { TroubleshootingData } from '../types.js';

/**
 * Generates HTML for the troubleshooting widget.
 * Creates an interactive troubleshooting guide with common issues, side effects, and emergency contacts.
 * 
 * @param troubleshootingData - Troubleshooting data for the specific medicine
 * @returns Complete HTML string ready for rendering in ChatGPT widget
 */
export function createTroubleshootingWidgetHTML(troubleshootingData: TroubleshootingData): string {
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
