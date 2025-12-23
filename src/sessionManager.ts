import Redis from 'ioredis';
import { jwtDecode } from 'jwt-decode';

/**
 * Session Manager for Multi-User Support
 * 
 * This class manages user sessions in Redis instead of global variables.
 * Each user gets their own isolated session stored by their unique session ID.
 * 
 * Key Concepts:
 * - Session ID: Extracted from JWT 'sub' claim (unique per user)
 * - Redis Key: "session:{sessionId}" for each user
 * - TTL: 30 minutes, auto-renewed on each request
 */

/**
 * Structure of data stored for each user session
 */
interface UserSession {
  accessToken: string | null;
  lc3Jwt: string | null;
  lc3Id: string | null;
  brand: string | null;
  emailId: string | null;
  officialBrandName: string | null;
  savingProgramEnrolledYear: string | null;
  userId: string | null;
  lastAccessed: number; // Timestamp of last request
}

/**
 * JWT payload structure (what's inside the token)
 */
interface JWTPayload {
  sub: string; // Session ID - unique identifier for the user
  'https://capi.lilly.com/userId'?: string;
  [key: string]: any;
}

/**
 * SessionManager Class
 * Handles all Redis operations for storing/retrieving user sessions
 */
class SessionManager {
  private redis: Redis;
  private readonly SESSION_TTL_SECONDS = 30 * 60; // 30 minutes
  private readonly SESSION_PREFIX = 'session:'; // Prefix for all session keys

  constructor() {
    // Connect to Redis using URL from environment variable
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    
    this.redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        // Exponential backoff: wait longer between retries
        const delay = Math.min(times * 50, 2000);
        return delay;
      }
    });

    // Event listeners for monitoring Redis connection
    this.redis.on('error', (error: Error) => {
      console.error('❌ Redis connection error:', error);
    });

    this.redis.on('connect', () => {
      console.log('✅ Redis connected successfully');
    });
  }

  /**
   * Extract Session ID from JWT Token
   * 
   * The 'sub' claim in JWT is a unique identifier for each user.
   * We use this as the session ID to isolate user data.
   * 
   * @param token - JWT token from Authorization header
   * @returns Session ID (sub claim)
   */
  private extractSessionId(token: string): string {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded.sub;
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      throw new Error('Invalid JWT token');
    }
  }

  /**
   * Extract User ID from JWT Token
   * 
   * Optional field in JWT that contains Lilly-specific user ID
   * 
   * @param token - JWT token
   * @returns User ID or null
   */
  private extractUserId(token: string): string | null {
    try {
      const decoded = jwtDecode<JWTPayload>(token);
      return decoded['https://capi.lilly.com/userId'] || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get or Create User Session
   * 
   * Process:
   * 1. Extract session ID from token (JWT 'sub' claim)
   * 2. Try to get existing session from Redis
   * 3. If found: Update lastAccessed time and extend TTL
   * 4. If not found: Create new session with default values
   * 
   * @param token - JWT token from Authorization header
   * @returns Session ID and session data
   */
  async getSession(token: string): Promise<{ sessionId: string; session: UserSession }> {
    const sessionId = this.extractSessionId(token);
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      // Try to get existing session from Redis
      const data = await this.redis.get(key);
      
      if (data) {
        // Session exists - parse JSON and update access time
        const session = JSON.parse(data) as UserSession;
        
        // Update last accessed time
        session.lastAccessed = Date.now();
        
        // Extend TTL (Time To Live) - session expires after 30 min of inactivity
        await this.redis.setex(key, this.SESSION_TTL_SECONDS, JSON.stringify(session));
        
        console.log(`🔄 Retrieved existing session: ${sessionId}`);
        return { sessionId, session };
      }

      // Session doesn't exist - create new one
      const newSession: UserSession = {
        accessToken: token,
        lc3Jwt: null,
        lc3Id: null,
        brand: null,
        emailId: null,
        officialBrandName: null,
        savingProgramEnrolledYear: null,
        userId: this.extractUserId(token),
        lastAccessed: Date.now()
      };

      // Store in Redis with 30-minute expiration
      await this.redis.setex(key, this.SESSION_TTL_SECONDS, JSON.stringify(newSession));
      console.log(`🆕 Created new session in Redis: ${sessionId}`);

      return { sessionId, session: newSession };
    } catch (error) {
      console.error('Redis error:', error);
      throw new Error('Session storage unavailable');
    }
  }

  /**
   * Update Session Data
   * 
   * Updates specific fields in a user's session without overwriting everything.
   * Automatically extends TTL to keep active sessions alive.
   * 
   * @param sessionId - Session ID (from getSession)
   * @param updates - Partial session data to update
   */
  async updateSession(sessionId: string, updates: Partial<UserSession>): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;

    try {
      // Get current session data
      const data = await this.redis.get(key);
      
      if (!data) {
        throw new Error('Session not found');
      }

      const session = JSON.parse(data) as UserSession;
      
      // Merge updates with existing session
      const updatedSession = {
        ...session,
        ...updates,
        lastAccessed: Date.now()
      };

      // Save back to Redis with renewed TTL
      await this.redis.setex(key, this.SESSION_TTL_SECONDS, JSON.stringify(updatedSession));
      console.log(`✅ Updated session: ${sessionId}`);
    } catch (error) {
      console.error('Failed to update session:', error);
      throw error;
    }
  }

  /**
   * Delete Session (Logout)
   * 
   * Removes user session from Redis
   * 
   * @param sessionId - Session ID to delete
   */
  async deleteSession(sessionId: string): Promise<void> {
    const key = `${this.SESSION_PREFIX}${sessionId}`;
    await this.redis.del(key);
    console.log(`🗑️  Deleted session: ${sessionId}`);
  }

  /**
   * Get Active Session Count
   * 
   * Counts how many active sessions are stored in Redis.
   * Useful for monitoring and debugging.
   * 
   * @returns Number of active sessions
   */
  async getActiveSessionCount(): Promise<number> {
    try {
      const keys = await this.redis.keys(`${this.SESSION_PREFIX}*`);
      return keys.length;
    } catch (error) {
      console.error('Failed to count sessions:', error);
      return 0;
    }
  }

  /**
   * Health Check
   * 
   * Verifies Redis connection is working
   * 
   * @returns true if Redis is responsive
   */
  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Graceful Shutdown
   * 
   * Closes Redis connection cleanly when server stops
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down session manager...');
    await this.redis.quit();
    console.log('✅ Session manager shut down');
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Graceful shutdown on process termination
process.on('SIGTERM', async () => {
  await sessionManager.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await sessionManager.shutdown();
  process.exit(0);
});