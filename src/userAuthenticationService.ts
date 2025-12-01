/**
 * userAuthenticationService.ts
 * 
 * Stores and provides access to the user's OAuth token from ChatGPT.
 * Token is extracted by verifyToken middleware and used by authenticated tools.
 */

let userAccessToken: string | null = null;
let lc3Jwt: string | null = null;
let lc3Id: string | null = null;
let brand: string | null = null;
let emailId: string | null = null;
let officialBrandName: string | null = null;

/**
 * Sets the current user's access token.
 * Called by verifyToken middleware after extracting token from Authorization header.
 */
export function setAccessToken(token: string | null): void {
  userAccessToken = token;
}

/**
 * Gets the current access token without throwing an error.
 * Returns null if no token is set.
 */
export function getAccessToken(): string | null {
  return userAccessToken;
}

/**
 * Gets the user token or throws an error if not authenticated.
 * Use this in tools that require authentication.
 */
export function requireAccessToken(): string {
  if (!userAccessToken) {
    throw new Error('Authentication required. Please log in via OAuth.');
  }
  return userAccessToken;
}

/**
 * Sets the LC3 JWT token.
 */
export function setLc3Jwt(token: string | null): void {
  lc3Jwt = token;
}

/**
 * Gets the LC3 JWT token or throws an error if not available.
 * Use this in tools that require LC3 JWT.
 */
export function requireLc3Jwt(): string {
  if (!lc3Jwt) {
    throw new Error('LC3 JWT token not available.');
  }
  return lc3Jwt;
}

/**
 * Sets the LC3 ID.
 */
export function setLc3Id(id: string | null): void {
  lc3Id = id;
}

/**
 * Gets the LC3 ID or throws an error if not available.
 * Use this in tools that require LC3 ID.
 */
export function requireLc3Id(): string {
  if (!lc3Id) {
    throw new Error('LC3 ID not available.');
  }
  return lc3Id;
}

/**
 * Sets the brand.
 */
export function setBrand(brandValue: string | null): void {
  brand = brandValue;
}

/**
 * Gets the brand or throws an error if not available.
 * Use this in tools that require brand information.
 */
export function requireBrand(): string {
  if (!brand) {
    throw new Error('Brand not available.');
  }
  return brand;
}

/**
 * Sets the email ID.
 */
export function setEmailId(email: string | null): void {
  emailId = email;
}

/**
 * Gets the email ID or throws an error if not available.
 * Use this in tools that require email ID.
 */
export function requireEmailId(): string {
  if (!emailId) {
    throw new Error('Email ID not available.');
  }
  return emailId;
}

/**
 * Sets the official brand name.
 */
export function setOfficialBrandName(name: string | null): void {
  officialBrandName = name;
}

/**
 * Gets the official brand name or throws an error if not available.
 * Use this in tools that require official brand name.
 */
export function requireOfficialBrandName(): string {
  if (!officialBrandName) {
    throw new Error('Official brand name not available.');
  }
  return officialBrandName;
}

/**
 * Maps brand name to official brand name.
 * 
 * @param brandName - The brand name (e.g., "taltz", "ebglyss")
 * @returns The official brand name or null if not found
 */
export function getOfficialBrandName(brandName: string): string | null {
  const brandMapping: { [key: string]: string } = {
    'taltz': 'Ixekizumab US',
    'ebglyss': 'Ebglyss US',
    'miri': 'Omvoh US',
    'olumiant': 'Olumiant US'
  };
  
  return brandMapping[brandName.toLowerCase()] || null;
}

/**
 * Decodes a JWT token and extracts the patient ID from dataScopes.
 * Does not verify signature - only decodes the payload.
 * 
 * @param token - The JWT token string
 * @returns The patient ID from dataScopes, or null if not found
 */
export function extractPatientId(token: string): string | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      console.error('Invalid JWT format: expected 3 parts');
      return null;
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    const decodedPayload = Buffer.from(payload, 'base64').toString('utf-8');
    const payloadJson = JSON.parse(decodedPayload);
    
    // Extract patient ID from dataScopes
    const patientId = payloadJson?.dataScopes?.patient;
    
    if (!patientId) {
      console.error('Patient ID not found in JWT token');
      return null;
    }
    
    return patientId;
  } catch (error) {
    console.error('Failed to decode JWT token:', error);
    return null;
  }
}
