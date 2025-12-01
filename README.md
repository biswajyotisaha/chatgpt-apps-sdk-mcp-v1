# Medicine Carousel MCP Server

TypeScript implementation of a medicine catalog MCP server for ChatGPT Apps SDK integration with OAuth 2.1 authentication. Displays FDA-approved Lilly Direct pharmaceuticals in an interactive carousel interface and provides authenticated user profile access.

## Overview

This MCP (Model Context Protocol) server provides an interactive medicine catalog for Lilly Direct pharmaceuticals with OAuth 2.1 + PKCE authentication through Auth0. It displays FDA-approved medications in a responsive carousel interface and enables authenticated users to access personalized profile data from AWS API Gateway.

## Features

- 💊 **Interactive Medicine Carousel** - Browse 7 FDA-approved medicines
- 🔐 **OAuth 2.1 Authentication** - Secure user authentication via Auth0 with PKCE
- 👤 **User Profile Integration** - Fetch authenticated user data from AWS API Gateway
- 🏥 **Pharmaceutical Styling** - Professional medical interface design
- 🛒 **Direct Purchase Links** - Links to Lilly Direct for each medicine
- ✅ **FDA Certification Display** - Clear FDA-approved badges
- 🚚 **Free Delivery Badges** - Delivery information for each medicine
- 📱 **Responsive Design** - Works across all ChatGPT display modes
- 🔧 **Built with TypeScript** - Type-safe development with Express
- 🚀 **Cloud Deployment Ready** - Configured for Render.com

## Medicine Catalog

Currently includes 7 FDA-approved medicines:

1. **Zepbound** - Weight management medication
2. **Humalog** - Insulin family products  
3. **Humulin** - Insulin family products
4. **Emgality** - Migraine prevention
5. **Basaglar** - Long-acting insulin
6. **LYUMJEV** - Rapid-acting insulin
7. **Rezvoglar** - Long-acting insulin biosimilar

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deployment on Render.com

### Build Configuration

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment**: Node 18+

### Environment Variables

Required environment variables:

```bash
# Server Configuration
NODE_ENV=production
PORT=8000  # Auto-configured by Render

# Auth0 OAuth Configuration
AUTH0_DOMAIN=your-tenant.auth0.com
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_client_id
AUTH0_CLIENT_SECRET=your_client_secret
AUTH0_AUDIENCE=https://your-api-gateway-url.com
```

### Auth0 Setup

1. **Create Auth0 Account** at https://auth0.com
2. **Create API** in Auth0 Dashboard:
   - Name: Your API name
   - Identifier: Your AWS API Gateway URL (used as `AUTH0_AUDIENCE`)
   - Signing Algorithm: RS256
   - Enable RBAC if needed
3. **Enable Dynamic Client Registration**:
   - Settings → Advanced → OAuth → Enable OIDC Dynamic Application Registration
4. **Configure Login Connections**:
   - Ensure at least one connection (Google, Username-Password, etc.) is enabled
   - Enable connection for dynamically created clients

### Deployment Steps

1. **Connect GitHub Repository**
   - Fork this repository
   - Connect to Render.com
   
2. **Configure Build Settings**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Node 18+

3. **Set Environment Variables**
   - `NODE_ENV=production`
   - `PORT` (auto-configured by Render)

## MCP Tools

### Available Tools

#### Public Tools (No Authentication Required)

- **show-all-medicines**: Display all medicines in interactive carousel
- **show-medicine**: Display specific medicine by name

#### Authenticated Tools (OAuth Required)

- **get-user-profile**: Fetch authenticated user profile from AWS API Gateway
  - Requires OAuth login via ChatGPT
  - Returns user name and organization
  - Displays in interactive user profile widget

### Tool Features

- Interactive carousel navigation with arrow buttons
- FDA-approved certification badges
- Free delivery indicators
- Direct purchase links to Lilly Direct
- Professional pharmaceutical styling
- Responsive design for all screen sizes
- User authentication with Auth0 OAuth 2.1 + PKCE
- Secure token-based API calls to AWS

## ChatGPT Integration

### MCP Configuration

Add the server URL to ChatGPT Desktop MCP settings:

```json
{
  "medicine-carousel-mcp": {
    "command": "curl", 
    "args": ["-X", "POST", "https://your-app.onrender.com/mcp"]
  }
}
```

### UI Integration

- **Resource Pattern**: Uses `ui://widget/medicine-carousel.html` 
- **MIME Type**: `text/html+skybridge` for ChatGPT Apps compatibility
- **State Sync**: Carousel state synchronizes with ChatGPT interface
- **Display Modes**: Supports inline, picture-in-picture, and fullscreen modes

## Architecture

### Current Implementation

- **Express.js**: HTTP server optimized for cloud deployment
- **MCP SDK**: Model Context Protocol integration for ChatGPT
- **TypeScript**: Type-safe development with interfaces
- **Auth0**: OAuth 2.1 + PKCE authentication provider
- **AWS API Gateway**: Backend API with JWT authorization
- **Static Data**: Medicine catalog defined in `src/data.ts`
- **Embedded HTML**: Self-contained UI widgets with inline CSS/JS

### Authentication Flow

1. ChatGPT queries `/.well-known/oauth-protected-resource` for OAuth metadata
2. ChatGPT discovers Auth0 via `/.well-known/openid-configuration`
3. ChatGPT dynamically registers with Auth0 using `/oidc/register`
4. User authenticates through Auth0 OAuth flow with PKCE
5. ChatGPT receives JWT access token with proper audience
6. Token is sent in Authorization header on tool invocations
7. MCP server extracts and stores token for authenticated API calls
8. AWS API Gateway validates JWT and returns user data

### Data Structure

```typescript
interface MedicineItem {
  id: string;
  name: string;
  logo: string;        // Medicine brand logo URL
  image: string;       // Product image URL  
  buyLink: string;     // Lilly Direct purchase URL
  buyLinkText: string; // Custom button text
}
```

## Future Improvements

### Dynamic Data Integration
- Replace static medicine list with API integration
- Real-time availability and pricing updates
- Automatic new medicine inclusion

### Enhanced Authentication & Personalization
- ✅ User OAuth authentication (Completed)
- ✅ User profile integration (Completed)
- Prescription management
- Insurance coverage integration
- Personalized medicine recommendations based on user data
- Order history and refill reminders

### Enhanced MCP Capabilities
- Medicine availability checking
- Prescription status tracking
- Delivery scheduling
- Medicine comparison tools
- Integration with user medical records

## Security & Compliance

- **OAuth 2.1 + PKCE**: Industry-standard authentication flow
- **JWT Token Validation**: AWS API Gateway validates all authenticated requests
- **Secure Token Storage**: Tokens stored in memory, never persisted
- **Input Sanitization**: All user inputs properly validated
- **HTTPS Assets**: All medicine images served over HTTPS
- **Safe External Links**: Direct links to official Lilly Direct domain
- **Environment Variables**: Secrets managed via environment variables, never in code
- **CORS Support**: Proper headers for ChatGPT integration
- **No PII Storage**: No personal identifiable information stored on MCP server

## Development Notes

- Uses StreamableHTTPServerTransport for ChatGPT Apps compatibility
- OAuth 2.1 + PKCE flow automatically handled by ChatGPT
- Tokens extracted from Authorization header by verifyToken middleware
- Non-blocking token verification - public tools work without auth
- Responsive carousel with dynamic width calculations
- Professional pharmaceutical styling with FDA compliance indicators
- Touch-friendly navigation for mobile devices
- Optimized image loading and layout consistency
- AWS API Gateway integration for authenticated backend calls

## API Endpoints

### MCP Protocol
- `POST /mcp` - Main MCP endpoint for tool invocations and resource requests

### OAuth & Health
- `GET /.well-known/oauth-protected-resource` - OAuth discovery metadata (required by ChatGPT)
- `GET /mcp/oauth` - OAuth configuration helper
- `GET /health` - Server health check

## Testing

### Test Public Tools
```bash
# Show all medicines (no auth required)
curl -X POST https://your-app.onrender.com/mcp \
  -H "Content-Type: application/json" \
  -d '{"method": "tools/call", "params": {"name": "show-all-medicines"}}'
```

### Test Authenticated Tool
Authenticated tools require valid OAuth token from ChatGPT. Use ChatGPT interface to test the `get-user-profile` tool after logging in.

---

**Note**: This server uses static medicine data for demonstration. OAuth integration enables secure access to user-specific data from AWS API Gateway. All secrets must be configured via environment variables.