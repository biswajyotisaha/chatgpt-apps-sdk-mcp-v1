import { AsyncLocalStorage } from 'async_hooks';
import { jwtDecode } from 'jwt-decode';
import { sessionManager } from './sessionManager.js';

/**
 * User Authentication Service (Redis Edition with AsyncLocalStorage)
 * 
 * This file provides helper functions to get/set user session data.
 * 
 * (Multi User with Redis + AsyncLocalStorage):
 * - Session data stored in Redis per user
 * - Each request has isolated async context
 * - Complete isolation between concurrent users
 * - Thread-safe for async operations
 */

/**
 * Request context interface
 * This gets attached to each async execution chain
 */
interface RequestContext {
  sessionId: string;
  token: string;
}

/**
 * JWT Payload for LC3 token
 */
interface LC3JWTPayload {
  patientId: string;
  [key: string]: any;
}

/**
 * AsyncLocalStorage for request-scoped context
 * 
 * This creates isolated storage for each request's async execution chain.
 * Unlike global variables, this won't be overwritten by concurrent requests.
 * 
 * How it works:
 * - Each request creates its own async context
 * - Context follows through all async operations (await, callbacks)
 * - Concurrent requests have completely separate contexts
 */
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Set Current Request Context (Thread-Safe)
 * 
 * Called by middleware to set the current user's session info.
 * Uses AsyncLocalStorage to ensure isolation between concurrent requests.
 * 
 * @param sessionId - User's session ID
 * @param token - User's access token
 */
export function setRequestContext(sessionId: string, token: string): void {
  asyncLocalStorage.enterWith({ sessionId, token });
}

/**
 * Clear Request Context
 * 
 * Called after request completes.
 * With AsyncLocalStorage, context is automatically cleaned up,
 * but this function is kept for explicit cleanup and compatibility.
 */
export function clearRequestContext(): void {
  // AsyncLocalStorage auto-cleans on async chain completion
  // This is a no-op but kept for API compatibility
}

/**
 * Get Current Context (Thread-Safe)
 * 
 * Retrieves the context for the current async execution chain.
 * Each concurrent request gets its own isolated context.
 * 
 * @returns Current request context
 * @throws Error if no context set (middleware not run)
 */
function requireContext(): RequestContext {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) {
    throw new Error('No request context available. Authentication middleware required.');
  }
  return ctx;
}

// ==================== ACCESS TOKEN ====================

/**
 * Get Access Token for Current User
 * 
 * @returns Access token or null
 */
export async function getAccessToken(): Promise<string | null> {
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.accessToken;
}

/**
 * Set Access Token for Current User
 * 
 * @param token - New access token
 */
export async function setAccessToken(token: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return; // No context = no session to update
  
  await sessionManager.updateSession(ctx.sessionId, {
    accessToken: token
  });
}

/**
 * Require Access Token (throws if missing)
 * 
 * @returns Access token
 * @throws Error if not authenticated
 */
export async function requireAccessToken(): Promise<string> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Authentication required. Please log in via OAuth.');
  }
  return token;
}

// ==================== LC3 JWT ====================

export async function getLc3Jwt(): Promise<string | null> {
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.lc3Jwt;
}

export async function setLc3Jwt(jwt: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return;
  
  await sessionManager.updateSession(ctx.sessionId, {
    lc3Jwt: jwt
  });
}

export async function requireLc3Jwt(): Promise<string> {
  const jwt = await getLc3Jwt();
  if (!jwt) {
    throw new Error('LC3 JWT not available. User may not be registered.');
  }
  return jwt;
}

// ==================== LC3 ID ====================

export async function getLc3Id(): Promise<string | null> {
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.lc3Id;
}

export async function setLc3Id(id: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return;
  
  await sessionManager.updateSession(ctx.sessionId, {
    lc3Id: id
  });
}

export async function requireLc3Id(): Promise<string> {
  const id = await getLc3Id();
  if (!id) {
    throw new Error('LC3 ID not available. User may not be registered.');
  }
  return id;
}

// ==================== BRAND ====================

export async function getBrand(): Promise<string | null> {
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.brand;
}

export async function setBrand(brand: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return;
  
  await sessionManager.updateSession(ctx.sessionId, {
    brand: brand
  });
}

export async function requireBrand(): Promise<string> {
  const brand = await getBrand();
  if (!brand) {
    throw new Error('Brand not available. User may not be registered.');
  }
  return brand;
}

// ==================== EMAIL ID ====================

export async function getEmailId(): Promise<string | null> {
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.emailId;
}

export async function setEmailId(email: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return;
  
  await sessionManager.updateSession(ctx.sessionId, {
    emailId: email
  });
}

export async function requireEmailId(): Promise<string> {
  const email = await getEmailId();
  if (!email) {
    throw new Error('Email ID not available. User may not be registered.');
  }
  return email;
}

// ==================== OFFICIAL BRAND NAME ====================

export async function getOfficialBrandName(brand?: string): Promise<string | null> {
  // If brand provided, use mapping logic
  if (brand) {
    const brandMap: Record<string, string> = {
      'taltz': 'Ixekizumab US',
      'trulicity': 'Dulaglutide US',
      'jardiance': 'Empagliflozin US',
      'mounjaro': 'Tirzepatide US'
    };
    return brandMap[brand.toLowerCase()] || brand;
  }
  
  // Otherwise, get from session
  const ctx = requireContext();
  const { session } = await sessionManager.getSession(ctx.token);
  return session.officialBrandName;
}

export async function setOfficialBrandName(name: string | null): Promise<void> {
  const ctx = asyncLocalStorage.getStore();
  if (!ctx) return;
  
  await sessionManager.updateSession(ctx.sessionId, {
    officialBrandName: name
  });
}

export async function requireOfficialBrandName(): Promise<string> {
  const name = await getOfficialBrandName();
  if (!name) {
    throw new Error('Official brand name not available.');
  }
  return name;
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Extract Patient ID from LC3 JWT
 * 
 * @param lc3Jwt - LC3 JWT token
 * @returns Patient ID
 */
export function extractPatientId(lc3Jwt: string): string {
  try {
    const decoded = jwtDecode<LC3JWTPayload>(lc3Jwt);
    if (!decoded.patient) {
      throw new Error('patientId not found in LC3 JWT');
    }
    return decoded.patient;
  } catch (error) {
    console.error('Error decoding LC3 JWT:', error);
    throw new Error('Failed to extract patient ID from LC3 JWT');
  }
}
