# Use Node.js 20 Alpine for smaller image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src
COPY public ./public

# Build TypeScript to JavaScript
RUN npm run build

# Remove source files (keep only compiled JavaScript)
RUN rm -rf src tsconfig.json

# Expose port 8000
EXPOSE 8000

# Set to production mode
ENV NODE_ENV=production

# Health check (Render will use this)
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1));"

# Start the server
CMD ["node", "dist/server.js"]