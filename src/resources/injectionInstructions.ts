import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerInjectionInstructionsResource(server: McpServer): void {
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval'; media-src 'self' https://delivery-p137454-e1438138.adobeaemcloud.com https://*.adobeaemcloud.com blob: data:; img-src 'self' https://delivery-p137454-e1438138.adobeaemcloud.com https://*.adobeaemcloud.com https://upload.wikimedia.org data:;">
  <title>Zepbound Injection Pen</title>
  <style>
    :root {
      --bg: #ffffff;
      --text: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --card: #ffffff;

      --toast-info-bg: #eef3ff;
      --toast-info-icon: #2563eb;

      --toast-warn-bg: #fdece7;
      --toast-warn-icon: #b45309;

      --danger: #dc2626;
      --success: #10b981;
      --shadow: 0 10px 30px rgba(17, 24, 39, 0.08);
      --radius-lg: 24px;
      --radius-md: 14px;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
      color: var(--text);
      background: #f3f4f6;
    }

    .page {
      max-width: 520px;
      margin: 24px auto;
      background: var(--bg);
      border: 1px solid #ddd;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .content {
      padding: 28px 24px 22px;
    }

    h1 {
      margin: 0 0 18px;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.2px;
    }

    /* Toast */
    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 14px;
      border-radius: 10px;
      border: 1px solid rgba(0,0,0,0.06);
      margin-bottom: 16px;
    }
    .toast.info { background: var(--toast-info-bg); }
    .toast.warn { background: var(--toast-warn-bg); }

    .toast .icon {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 16px;
      flex: 0 0 auto;
    }
    .toast.info .icon { color: #fff; background: var(--toast-info-icon); }
    .toast.warn .icon { color: #fff; background: var(--toast-warn-icon); }

    .toast .msg {
      flex: 1 1 auto;
      color: #1f2937;
      font-size: 15px;
      line-height: 1.4;
    }

    .toast .close {
      border: 0;
      background: transparent;
      font-size: 20px;
      line-height: 1;
      color: #6b7280;
      cursor: pointer;
      padding: 6px 8px;
      border-radius: 8px;
    }
    .toast .close:hover { background: rgba(0,0,0,0.05); }

    /* Step row */
    .step-row {
      margin: 18px 0 10px;
      display: flex;
      align-items: baseline;
      gap: 10px;
      flex-wrap: wrap;
    }
    .step-row .step {
      font-weight: 600;
      color: var(--muted);
    }
    .step-row .title {
      font-weight: 700;
      font-size: 18px;
    }

    /* Progress: 4 pills */
    .progress {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin: 10px 0 18px;
    }
    .pill {
      height: 10px;
      border-radius: 999px;
      background: #d1d5db;
      transition: background 0.3s ease;
    }
    .pill.done { background: #6b7280; }
    .pill.active { background: #111827; }

    /* Card */
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow);
      overflow: hidden;
    }
    .card .card-visual {
      width: 100%;
      display: block;
      aspect-ratio: 4 / 3.2;
      background: #f9fafb;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .card .card-visual img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .card .card-body {
      padding: 16px 16px 18px;
    }
    .card .subhead {
      margin: 0;
      color: #374151;
      font-size: 15px;
      line-height: 1.55;
    }

    /* Bottom area */
    .bottom {
      margin-top: 18px;
      display: grid;
      gap: 14px;
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding-top: 2px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      border-radius: 999px;
      padding: 14px 18px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: #fff;
      color: #111827;
      min-width: 120px;
      transition: all 0.2s;
    }
    .btn:hover { background: #f9fafb; }
    .btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .btn-primary {
      background: var(--danger);
      color: #fff;
      border-color: transparent;
      min-width: 132px;
    }
    .btn-primary:hover:not(:disabled) { filter: brightness(0.95); }

    .btn .arrow { font-size: 18px; line-height: 0; }

    /* Video section */
    .video-section {
      padding-top: 14px;
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .video-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 18px;
      background: #f3f4f6;
      border: 1px solid #d1d5db;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
    }
    .video-btn:hover { background: #e5e7eb; }

    /* Video Modal */
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
    .video-modal.active { display: flex; }

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
      font-size: 20px;
      font-weight: bold;
      color: #333;
    }
    .video-close:hover { background: #fff; }

    /* Complete message */
    .complete-message {
      text-align: center;
      padding: 40px 10px;
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
    .complete-icon svg { width: 32px; height: 32px; fill: white; }
    .complete-title { font-size: 22px; font-weight: 700; margin-bottom: 12px; }
    .complete-text { font-size: 15px; color: var(--muted); line-height: 1.6; }

    .hidden { display: none !important; }

    .spacer { height: 6px; }

    @media (max-width: 480px) {
      .actions { flex-direction: column; gap: 12px; }
      .btn { width: 100%; justify-content: center; }
      .video-section { flex-direction: column; }
      .video-btn { width: 100%; justify-content: center; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="content">
      <h1 id="medicine-name">Zepbound Injection Pen</h1>

      <!-- Top toast - info disclaimer -->
      <div class="toast info" role="status" aria-live="polite" id="info-toast">
        <div class="icon">i</div>
        <div class="msg">These are official manufacturer instructions. Always consult your healthcare provider with questions.</div>
        <button class="close" aria-label="Close">×</button>
      </div>

      <!-- Step + progress -->
      <div class="step-row">
        <div class="step" id="step-indicator">1 of 4</div>
        <div class="title" id="step-title">Choose your injection site</div>
      </div>
      <div class="progress" aria-label="Progress" id="progress-pills">
        <div class="pill active" title="Step 1"></div>
        <div class="pill" title="Step 2"></div>
        <div class="pill" title="Step 3"></div>
        <div class="pill" title="Step 4"></div>
      </div>

      <!-- Main card -->
      <div class="card" id="main-card">
        <div class="card-visual" id="step-visual">
          <img id="step-image" src="https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d0514e55-3fb6-4541-a31a-dd466f7ad415/as/injection_step_1.avif?assetname=injection_step_1.png&width=1200&format=avif" alt="Injection step illustration" />
        </div>
        <div class="card-body">
          <p class="subhead" id="step-description">You may inject Zepbound in your stomach (abdomen) at least 2 inches away from your belly button, in the front of your thigh, or in the back of your upper arm (with help from another person). Choose a different injection site each week.</p>
        </div>
      </div>

      <div class="bottom">
        <!-- Bottom toast - warning -->
        <div class="toast warn" role="status" aria-live="polite" id="warning-toast">
          <div class="icon">!</div>
          <div class="msg" id="warning-text">Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.</div>
          <button class="close" aria-label="Close">×</button>
        </div>

        <!-- Buttons -->
        <div class="actions" id="navigation">
          <button class="btn" type="button" id="btn-back" disabled>
            <span class="arrow">←</span>
            Back
          </button>
          <button class="btn btn-primary" type="button" id="btn-next">
            Next
            <span class="arrow">→</span>
          </button>
        </div>

        <!-- Video section (shown on completion) -->
        <div class="video-section hidden" id="video-section">
          <button class="video-btn" id="watch-video-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
              <path d="M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z"/>
            </svg>
            Watch Training Video
          </button>
          <a href="https://uspl.lilly.com/zepbound/zepbound.html#ug" target="_blank" class="video-btn" id="instructions-link">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 256 256">
              <path d="M224,104a8,8,0,0,1-16,0V59.31l-66.35,66.34a8,8,0,0,1-11.31-11.31L196.69,48H152a8,8,0,0,1,0-16h64a8,8,0,0,1,8,8Zm-40,24a8,8,0,0,0-8,8v72H48V80h72a8,8,0,0,0,0-16H48A16,16,0,0,0,32,80V208a16,16,0,0,0,16,16H176a16,16,0,0,0,16-16V136A8,8,0,0,0,184,128Z"/>
            </svg>
            Official Instructions
          </a>
        </div>
      </div>

      <div class="spacer"></div>
    </div>
  </div>

  <!-- Video Modal -->
  <div class="video-modal" id="video-modal">
    <div class="video-container">
      <button class="video-close" id="video-close">×</button>
      <video id="video-player" controls preload="metadata">
        <source id="video-source" src="" type="video/mp4">
        Your browser does not support the video tag.
      </video>
    </div>
  </div>

  <script>
    // Injection steps data - 4 simple steps from official Zepbound instructions
    const defaultSteps = [
      {
        title: "Choose your injection site",
        description: "You may inject Zepbound in your stomach (abdomen) at least 2 inches away from your belly button, in the front of your thigh, or in the back of your upper arm (with help from another person). Choose a different injection site each week.",
        warning: "Do not inject into skin that is tender, bruised, red, hard, or has scars or stretch marks.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d0514e55-3fb6-4541-a31a-dd466f7ad415/as/injection_step_1.avif?assetname=injection_step_1.png&width=1200&format=avif"
      },
      {
        title: "Pull off the gray base cap",
        description: "Pull off the gray base cap while the pen is locked. Do not put the gray base cap back on — this could damage the needle. You may see a few drops of medicine on the needle or clear base. This is normal.",
        warning: "Do not touch the needle. After you remove the cap, you must use the pen within 5 minutes.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:66d7adbb-0a6a-4cbe-a622-2e305f2136b3/as/injection_step_2.avif?assetname=injection_step_2.png&width=1200&format=avif"
      },
      {
        title: "Place on skin and unlock",
        description: "Place the clear base flat on your skin at your chosen injection site. Make sure you can see the medicine window. Then turn the lock ring to unlock the pen.",
        warning: "Do not press the injection button until the clear base is flat against your skin and the pen is unlocked.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:7248da27-e860-4a4f-911e-700f4162987f/as/injection_step_3.avif?assetname=injection_step_3.png&width=1200&format=avif"
      },
      {
        title: "Press and hold the button",
        description: "Press and hold the purple injection button for up to 10 seconds. Listen for the first click — it means the injection has started. Keep holding. When you hear the second click, the injection is complete. You may now lift the pen.",
        warning: "Do not lift the pen until you hear the second click. If the gray plunger is NOT visible in the window after injection, contact your healthcare provider.",
        image: "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:ad1c3410-ec02-447b-8f83-e9ac5eb1741e/as/injection_step_4.avif?assetname=injection_step_4.png&width=1200&format=avif"
      }
    ];

    let currentStep = 0;
    let steps = defaultSteps;
    let videoUrl = "https://delivery-p137454-e1438138.adobeaemcloud.com/adobe/assets/urn:aaid:aem:d8b622f8-8dd3-4fe8-8d79-e131035ba306/renditions/original/as/cmat-02292-single-dose-pen-injection-training-video.mp4";
    let instructionsUrl = "https://uspl.lilly.com/zepbound/zepbound.html#ug";

    // DOM elements
    const medicineName = document.getElementById('medicine-name');
    const stepIndicator = document.getElementById('step-indicator');
    const stepTitle = document.getElementById('step-title');
    const progressPills = document.getElementById('progress-pills');
    const mainCard = document.getElementById('main-card');
    const stepImage = document.getElementById('step-image');
    const stepDescription = document.getElementById('step-description');
    const warningToast = document.getElementById('warning-toast');
    const warningText = document.getElementById('warning-text');
    const btnBack = document.getElementById('btn-back');
    const btnNext = document.getElementById('btn-next');
    const navigation = document.getElementById('navigation');
    const videoSection = document.getElementById('video-section');
    const watchVideoBtn = document.getElementById('watch-video-btn');
    const instructionsLink = document.getElementById('instructions-link');

    function updateProgressPills() {
      const pills = progressPills.querySelectorAll('.pill');
      pills.forEach((pill, index) => {
        pill.classList.remove('done', 'active');
        if (index < currentStep) {
          pill.classList.add('done');
        } else if (index === currentStep) {
          pill.classList.add('active');
        }
      });
    }

    function renderStep() {
      if (currentStep >= steps.length) {
        // Show completion message
        mainCard.innerHTML = \`
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
        stepTitle.textContent = 'All steps completed';
        warningToast.classList.add('hidden');
        navigation.classList.add('hidden');
        videoSection.classList.remove('hidden');
        
        // Update all pills to done
        const pills = progressPills.querySelectorAll('.pill');
        pills.forEach(pill => {
          pill.classList.remove('active');
          pill.classList.add('done');
        });
        return;
      }

      const step = steps[currentStep];

      // Update step indicator and title
      stepIndicator.textContent = \`\${currentStep + 1} of \${steps.length}\`;
      stepTitle.textContent = step.title;

      // Update progress pills
      updateProgressPills();

      // Update card content
      mainCard.innerHTML = \`
        <div class="card-visual">
          <img id="step-image" src="\${step.image}" alt="\${step.title}" onerror="this.style.display='none';" />
        </div>
        <div class="card-body">
          <p class="subhead">\${step.description}</p>
        </div>
      \`;

      // Update warning toast
      if (step.warning) {
        warningText.textContent = step.warning;
        warningToast.classList.remove('hidden');
      } else {
        warningToast.classList.add('hidden');
      }

      // Update buttons
      btnBack.disabled = currentStep === 0;
      btnNext.innerHTML = currentStep === steps.length - 1 
        ? 'Finish <span class="arrow">✓</span>' 
        : 'Next <span class="arrow">→</span>';

      navigation.classList.remove('hidden');
      videoSection.classList.add('hidden');
    }

    // Event listeners for navigation
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

    // Toast close buttons
    document.querySelectorAll('.toast .close').forEach(btn => {
      btn.addEventListener('click', () => {
        const toast = btn.closest('.toast');
        toast?.classList.add('hidden');
      });
    });

    // Video modal elements
    const videoModal = document.getElementById('video-modal');
    const videoPlayer = document.getElementById('video-player');
    const videoSource = document.getElementById('video-source');
    const videoCloseBtn = document.getElementById('video-close');

    watchVideoBtn.addEventListener('click', () => {
      videoSource.src = videoUrl;
      videoPlayer.load();
      videoModal.classList.add('active');
      videoPlayer.play().catch(e => console.log('Autoplay prevented:', e));
    });

    videoCloseBtn.addEventListener('click', () => {
      videoModal.classList.remove('active');
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
    });

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
        // Regenerate progress pills based on actual step count
        progressPills.innerHTML = steps.map((_, i) => 
          \`<div class="pill\${i === 0 ? ' active' : ''}" title="Step \${i + 1}"></div>\`
        ).join('');
      }
      if (out.videoUrl) {
        videoUrl = out.videoUrl;
      }
      if (out.instructionsUrl) {
        instructionsUrl = out.instructionsUrl;
        instructionsLink.href = instructionsUrl;
      }
      if (out.medicineName) {
        medicineName.textContent = out.medicineName + ' Injection Pen';
      }
      renderStep();
    }

    loadFromToolOutput();
    window.addEventListener('openai:set_globals', loadFromToolOutput);
    window.addEventListener('openai:tool_response', loadFromToolOutput);

    console.log('Zepbound injection instructions widget loaded - Lilly theme');
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
}
