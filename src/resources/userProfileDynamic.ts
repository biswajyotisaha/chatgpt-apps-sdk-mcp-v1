import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerUserProfileResource(server: McpServer): void {

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
  --panel:#e5e5e5;
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

.profile-panel{
  background:transparent;
  width:100%;
  max-width:900px;
  padding:50px 60px;
}

.profile-title{
  font-size:28px;
  font-weight:600;
  margin-bottom:40px;
}

.profile-grid{
  display:grid;
  grid-template-columns:220px 1fr;
  row-gap:26px;
  column-gap:40px;
  font-size:18px;
}

.label{
  font-weight:600;
}

.value{
  font-weight:400;
  color:#333;
  line-height:1.4;
}

.value.empty{
  color:var(--muted);
  font-style:italic;
}
</style>
</head>

<body>

<div id="skeleton">Loading user profile…</div>
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

  const residence = profile.primaryResidence;
  let address = '';
  if (residence && typeof residence === 'object') {
    address = [
      residence.address1,
      residence.address2,
      residence.city,
      residence.state,
      residence.zipCode
    ].filter(Boolean).join(', ');
  }

  root.innerHTML = \`
    <section class="profile-panel">
      <div class="profile-title">Profile Information</div>

      <div class="profile-grid">
        <div class="label">First name:</div>
        <div class="value \${givenName ? '' : 'empty'}">\${givenName || 'Not provided'}</div>

        <div class="label">Last name:</div>
        <div class="value \${familyName ? '' : 'empty'}">\${familyName || 'Not provided'}</div>

        <div class="label">Email:</div>
        <div class="value \${email ? '' : 'empty'}">\${email || 'Not provided'}</div>

        <div class="label">Phone:</div>
        <div class="value \${phoneNumber ? '' : 'empty'}">\${phoneNumber || 'Not provided'}</div>

        <div class="label">Date of birth:</div>
        <div class="value \${dob ? '' : 'empty'}">\${dob || 'Not provided'}</div>

        <div class="label">Gender:</div>
        <div class="value \${gender ? '' : 'empty'}">
          \${gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : 'Not provided'}
        </div>

        <div class="label">Address:</div>
        <div class="value \${address ? '' : 'empty'}">\${address || 'Not provided'}</div>
      </div>
    </section>
  \`;

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
}
