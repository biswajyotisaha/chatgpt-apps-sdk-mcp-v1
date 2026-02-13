import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerAppCapabilitiesResource(server: McpServer): void {

server.registerResource(
  'app-capabilities',
  'ui://widget/app-capabilities-v1.html',
  {
    _meta: {
      'openai/widgetDomain': 'https://app-capabilities.onrender.com',
      'openai/widgetCSP': {
        connect_domains: [],
        resource_domains: []
      }
    }
  },
  async () => ({
    contents: [
      {
        uri: 'ui://widget/app-capabilities-v1.html',
        mimeType: 'text/html+skybridge',
        text: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>App Capabilities</title>

<style>
:root{
  --text:#2d2d2d;
  --muted:#555;
}

*{ box-sizing:border-box; }

body{
  margin:0;
  font-family: Helvetica, Arial, sans-serif;
  color:var(--text);
  background:white;
  display:flex;
  justify-content:center;
  padding:60px 20px;
}

.capabilities-panel{
  background:transparent;
  width:100%;
  max-width:900px;
  padding:50px 60px;
}

.capabilities-title{
  font-size:28px;
  font-weight:600;
  margin-bottom:40px;
}

.category{
  margin-bottom:32px;
}

.category-header{
  display:flex;
  align-items:center;
  gap:10px;
  margin-bottom:14px;
}

.category-icon{
  font-size:22px;
}

.category-name{
  font-size:20px;
  font-weight:600;
}

.feature-list{
  list-style:none;
  padding:0;
  margin:0;
}

.feature-list li{
  padding:8px 0;
  font-size:17px;
  line-height:1.5;
  border-top:1px dashed #cfcfcf;
}

.feature-list li:first-child{
  border-top:none;
}

.feature-name{
  font-weight:600;
}

.feature-desc{
  color:var(--muted);
}

.footer-note{
  margin-top:36px;
  font-size:16px;
  color:var(--muted);
  font-style:italic;
}
</style>
</head>

<body>

<div id="skeleton">Loading capabilities…</div>
<div id="root" hidden></div>

<script>
const root = document.getElementById('root');
const skeleton = document.getElementById('skeleton');

function renderIfReady() {
  const out = window.openai?.toolOutput || {};
  const categories = out.categories || null;
  if (!categories) return;

  let html = '<section class="capabilities-panel">';
  html += '<div class="capabilities-title">What can this app do</div>';

  categories.forEach(function(cat) {
    html += '<div class="category">';
    html += '<div class="category-header">';
    html += '<span class="category-icon">' + cat.icon + '</span>';
    html += '<span class="category-name">' + cat.name + '</span>';
    html += '</div>';
    html += '<ul class="feature-list">';
    cat.features.forEach(function(f) {
      html += '<li><span class="feature-name">' + f.name + '</span> <span class="feature-desc">— ' + f.description + '</span></li>';
    });
    html += '</ul>';
    html += '</div>';
  });

  html += '<div class="footer-note">Just ask me about any of these and I\\'ll get started!</div>';
  html += '</section>';

  root.innerHTML = html;
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
          'openai/widgetDomain': 'https://app-capabilities.onrender.com',
          'openai/widgetCSP': {
            connect_domains: [],
            resource_domains: []
          }
        }
      },
    ]
  })
);
}
