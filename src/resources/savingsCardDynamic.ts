import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerSavingsCardResource(server: McpServer): void {
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
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Savings Card</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      background: transparent;
      margin: 0;
      padding: 40px;
      color: #222;
    }

    .container {
      max-width: 900px;
      margin: auto;
    }

    .header {
      font-size: 28px;
      margin-bottom: 20px;
    }

    .card {
      background: #bfbfbf;
      border-radius: 24px;
      padding: 40px;
      box-shadow: 0 4px 10px rgba(0,0,0,0.15);
      margin-bottom: 40px;
    }

    .logo {
      margin-bottom: 20px;
    }

    .logo img {
      height: 60px;
      width: auto;
      object-fit: contain;
    }

    .label {
      letter-spacing: 2px;
      font-size: 14px;
      color: #333;
      margin-bottom: 10px;
    }

    .card-number {
      font-size: 42px;
      font-weight: 500;
      margin-bottom: 20px;
    }

    .expires {
      display: inline-block;
      background: #e8e8e8;
      padding: 10px 18px;
      border-radius: 20px;
      font-size: 14px;
      margin-bottom: 20px;
    }

    .subtext {
      max-width: 600px;
      line-height: 1.6;
      color: #333;
    }

    .details {
      display: grid;
      grid-template-columns: 150px 1fr;
      row-gap: 20px;
      column-gap: 20px;
      font-size: 18px;
    }

    .details .title {
      font-weight: bold;
      letter-spacing: 1px;
    }

    #skeleton { text-align: center; padding: 40px; color: #666; }
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
  <div class="container">
    <div class="header">Lilly Savings Card</div>

    <div class="card">
      <div class="logo"><img src="https://upload.wikimedia.org/wikipedia/commons/1/1e/Lilly-Logo.svg" alt="Lilly" /></div>

      <div class="label">SAVINGS CARD</div>
      <div class="card-number">\${cardNumber}</div>

      <div class="expires">Expires: 12/31/\${expirationYear}</div>

      <div class="subtext">
        Offer good until <strong>12/31/\${expirationYear}</strong> or for up to 24 months from patient qualification into the program, whichever comes first.
      </div>
    </div>

    <div class="details">
      <div class="title">RXBIN:</div>
      <div>\${rxBIN}</div>

      <div class="title">PCN:</div>
      <div>\${rxPCN}</div>

      <div class="title">GRP:</div>
      <div>\${rxGroup}</div>

      <div class="title">ID:</div>
      <div>\${cardNumber}</div>
    </div>
  </div>\`;

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
}
