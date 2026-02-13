// ==================== APPLICATION CONSTANTS ====================

// Server configuration
export const PORT = parseInt(process.env.PORT || '3000', 10);

// API Gateway URLs
export const CAPI_GATEWAY_URL = process.env.CAPI_GATEWAY_URL || 'https://consumer-api.iv.apps.lilly.com';
export const LC3_GATEWAY_URL = process.env.LC3_GATEWAY_URL || 'https://lillytogether-gateway.iv.connectedcarecloud.com';
export const DHISP_GATEWAY_URL = process.env.DHISP_GATEWAY_URL || 'https://qa.ext-llydhisp.net/digh-lillytogether-test-xapi-v2';

// LC3 Gateway Headers (hardcoded - simulating mobile app device)
export const LC3_IDENTITY_PROVIDER = 'okta';
export const LC3_DEVICE_OS_VERSION = '18.7.1';
export const LC3_DEVICE = 'iPhone14,7';
export const LC3_DEVICE_MANUFACTURER = 'Apple Inc';
export const LC3_APP_NAME = 'lillyplus';
export const LC3_APP_VERSION = '19.0.0';
export const LC3_DEVICE_OS = 'ios';
