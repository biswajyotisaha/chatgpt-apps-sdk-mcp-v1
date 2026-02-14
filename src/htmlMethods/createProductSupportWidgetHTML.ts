export function createProductSupportWidgetHTML(embeddedProfile?: any): string {
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
                    <option value="PR">Puerto Rico</option>
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
      console.log('🔄 loadUserProfile called');
      // Read profile from ChatGPT SDK toolOutput (primary), fall back to embedded data
      var toolOutput = (window.openai && window.openai.toolOutput) || {};
      var profile = toolOutput.profile || window.__embeddedProfile || null;
      
      console.log('🔍 window.openai.toolOutput:', toolOutput);
      console.log('🔍 Resolved profile:', profile);
      
      if (!profile) {
        console.log('❌ No profile data available (toolOutput or embedded)');
        return;
      }
      
      console.log('✅ Profile data found, populating form...');
      
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
      console.log('📋 Populating user info with profile:', JSON.stringify(profile, null, 2));
      
      // Name fields
      if (profile.givenName) {
        document.getElementById('firstName').value = profile.givenName;
        userInfo.firstName = profile.givenName;
        console.log('✅ First name set:', profile.givenName);
      }
      if (profile.familyName) {
        document.getElementById('lastName').value = profile.familyName;
        userInfo.lastName = profile.familyName;
        console.log('✅ Last name set:', profile.familyName);
      }
      
      // Contact fields
      if (profile.email) {
        document.getElementById('email').value = profile.email;
        userInfo.email = profile.email;
        console.log('✅ Email set:', profile.email);
      }
      if (profile.phoneNumber) {
        document.getElementById('phone').value = profile.phoneNumber;
        userInfo.phone = profile.phoneNumber;
        console.log('✅ Phone set:', profile.phoneNumber);
      }
      
      // Date of birth - check both dateOfBirth and dob
      if (profile.dateOfBirth) {
        document.getElementById('dateOfBirth').value = profile.dateOfBirth;
        userInfo.dateOfBirth = profile.dateOfBirth;
        console.log('✅ DOB set from dateOfBirth:', profile.dateOfBirth);
      } else if (profile.dob) {
        document.getElementById('dateOfBirth').value = profile.dob;
        userInfo.dateOfBirth = profile.dob;
        console.log('✅ DOB set from dob:', profile.dob);
      }
      
      // Address - primaryResidence format (AWS API)
      var residence = profile.primaryResidence;
      console.log('🏠 primaryResidence data:', residence);
      
      if (residence && typeof residence === 'object') {
        if (residence.address1) {
          document.getElementById('address').value = residence.address1;
          userInfo.address = residence.address1;
          console.log('✅ Street address set:', residence.address1);
        }
        if (residence.address2) {
          document.getElementById('apartment').value = residence.address2;
          userInfo.apartment = residence.address2;
          console.log('✅ Apartment set:', residence.address2);
        }
        if (residence.city) {
          document.getElementById('city').value = residence.city;
          userInfo.city = residence.city;
          console.log('✅ City set:', residence.city);
        }
        if (residence.state) {
          var stateSelect = document.getElementById('state');
          stateSelect.value = residence.state;
          userInfo.state = residence.state;
          console.log('✅ State set:', residence.state);
        }
        if (residence.zipCode) {
          document.getElementById('zipCode').value = residence.zipCode;
          userInfo.zipCode = residence.zipCode;
          console.log('✅ ZIP code set:', residence.zipCode);
        }
      }
      
      // Fallback: Legacy address format
      if (profile.address && typeof profile.address === 'object') {
        console.log('🏠 Legacy address data:', profile.address);
        if (profile.address.street && !userInfo.address) {
          document.getElementById('address').value = profile.address.street;
          userInfo.address = profile.address.street;
        }
        if (profile.address.city && !userInfo.city) {
          document.getElementById('city').value = profile.address.city;
          userInfo.city = profile.address.city;
        }
        if (profile.address.state && !userInfo.state) {
          document.getElementById('state').value = profile.address.state;
          userInfo.state = profile.address.state;
        }
        if (profile.address.zipCode && !userInfo.zipCode) {
          document.getElementById('zipCode').value = profile.address.zipCode;
          userInfo.zipCode = profile.address.zipCode;
        }
      }
      
      console.log('📋 Final userInfo state:', JSON.stringify(userInfo, null, 2));
      
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
    
    // Embedded profile data from server (fallback)
    window.__embeddedProfile = ${profileJSON};
    
    // Listen for ChatGPT SDK events to receive toolOutput profile data
    window.addEventListener('openai:tool_response', function() {
      console.log('📡 openai:tool_response event received');
      var toolOutput = (window.openai && window.openai.toolOutput) || {};
      if (toolOutput.profile && document.getElementById('your-info') && document.getElementById('your-info').classList.contains('active')) {
        loadUserProfile();
      }
    });
    window.addEventListener('openai:set_globals', function() {
      console.log('📡 openai:set_globals event received');
      var toolOutput = (window.openai && window.openai.toolOutput) || {};
      if (toolOutput.profile && document.getElementById('your-info') && document.getElementById('your-info').classList.contains('active')) {
        loadUserProfile();
      }
    });
    
    console.log('Product Support widget loaded');
  </script>
</body>
</html>`;
}
