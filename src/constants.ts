// ==================== APPLICATION CONSTANTS ====================

// Server configuration
export const PORT = parseInt(process.env.PORT || '3000', 10);

// API Gateway URLs
export const CAPI_GATEWAY_URL = process.env.CAPI_GATEWAY_URL!;
export const LC3_GATEWAY_URL = process.env.LC3_GATEWAY_URL!;
export const DHISP_GATEWAY_URL = process.env.DHISP_GATEWAY_URL!;

// Auth / OAuth URLs
export const LILLY_ISSUER_BASE_URL = process.env.LILLY_ISSUER_BASE_URL || 'https://poc-spe-a.lilly.com';
export const LILLY_AUDIENCE = process.env.LILLY_AUDIENCE || 'https://poc-spe-a.lilly-dev.auth0app.com/api/v2/';

// LC3 Gateway Headers (hardcoded - simulating mobile app device)
export const LC3_IDENTITY_PROVIDER = 'okta';
export const LC3_DEVICE_OS_VERSION = '18.7.1';
export const LC3_DEVICE = 'iPhone14,7';
export const LC3_DEVICE_MANUFACTURER = 'Apple Inc';
export const LC3_APP_NAME = 'lillyplus';
export const LC3_APP_VERSION = '19.0.0';
export const LC3_DEVICE_OS = 'ios';
