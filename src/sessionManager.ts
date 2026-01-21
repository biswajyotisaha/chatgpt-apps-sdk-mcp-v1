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
 * - Product Quality Complaints: Stored with "pq:{referenceId}" keys
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
  hasViewedTrainingVideo: Record<string, boolean>; // Track training video viewing per medicine ID
}

/**
 * Structure for Product Quality Complaints
 */
interface ProductQualityComplaint {
  referenceId: string;
  medicineId: string;
  medicineName: string;
  deviceName: string;
  issueType: string;
  occurrenceDate: string;
  lotNumber: string;
  additionalDetails: string;
  troubleshootingSteps: string[];
  userResponses: Record<string, string>;
  submittedAt: string;
  sessionId?: string;
  userId?: string;
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
  private readonly PQ_PREFIX = 'pq:'; // Prefix for product quality complaints
  private readonly PQ_LIST_KEY = 'pq:all'; // List to track all complaint IDs
  private readonly PQ_TTL_SECONDS = 90 * 24 * 60 * 60; // 90 days for complaints

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
        lastAccessed: Date.now(),
        hasViewedTrainingVideo: {}
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
   * Generate Unique Product Quality Reference ID
   * 
   * Format: PQ-YYYYMMDD-XXXXX (e.g., PQ-20260121-00001)
   * Uses Redis counter to ensure uniqueness
   * 
   * @returns Unique reference ID
   */
  private async generatePQReferenceId(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const counterKey = `pq:counter:${dateStr}`;
    
    // Increment daily counter (auto-expires after 2 days)
    const count = await this.redis.incr(counterKey);
    await this.redis.expire(counterKey, 2 * 24 * 60 * 60);
    
    // Format: PQ-YYYYMMDD-XXXXX
    const paddedCount = count.toString().padStart(5, '0');
    return `PQ-${dateStr}-${paddedCount}`;
  }

  /**
   * Store Product Quality Complaint
   * 
   * Saves complaint data to Redis with unique reference ID.
   * Also adds to a list for easy retrieval of all complaints.
   * 
   * @param complaintData - Complaint data without referenceId
   * @param sessionId - Optional session ID of user submitting
   * @param userId - Optional user ID
   * @returns Generated reference ID
   */
  async storeProductQualityComplaint(
    complaintData: Omit<ProductQualityComplaint, 'referenceId' | 'submittedAt'>,
    sessionId?: string,
    userId?: string
  ): Promise<string> {
    try {
      const referenceId = await this.generatePQReferenceId();
      const key = `${this.PQ_PREFIX}${referenceId}`;
      
      const complaint: ProductQualityComplaint = {
        ...complaintData,
        referenceId,
        submittedAt: new Date().toISOString(),
        sessionId,
        userId
      };

      // Store complaint with 90-day TTL
      await this.redis.setex(key, this.PQ_TTL_SECONDS, JSON.stringify(complaint));
      
      // Add reference ID to the list of all complaints
      await this.redis.lpush(this.PQ_LIST_KEY, referenceId);
      
      console.log(`📋 Stored product quality complaint: ${referenceId}`);
      return referenceId;
    } catch (error) {
      console.error('Failed to store complaint:', error);
      throw error;
    }
  }

  /**
   * Get Product Quality Complaint by Reference ID
   * 
   * @param referenceId - The PQ reference ID
   * @returns Complaint data or null if not found
   */
  async getProductQualityComplaint(referenceId: string): Promise<ProductQualityComplaint | null> {
    try {
      const key = `${this.PQ_PREFIX}${referenceId}`;
      const data = await this.redis.get(key);
      
      if (data) {
        return JSON.parse(data) as ProductQualityComplaint;
      }
      return null;
    } catch (error) {
      console.error('Failed to get complaint:', error);
      return null;
    }
  }

  /**
   * Get All Product Quality Complaints
   * 
   * Retrieves all stored complaints with optional pagination.
   * 
   * @param limit - Maximum number to return (default 100)
   * @param offset - Number to skip (default 0)
   * @returns Array of complaints
   */
  async getAllProductQualityComplaints(
    limit: number = 100,
    offset: number = 0
  ): Promise<ProductQualityComplaint[]> {
    try {
      // Get reference IDs from list
      const referenceIds = await this.redis.lrange(this.PQ_LIST_KEY, offset, offset + limit - 1);
      
      if (referenceIds.length === 0) {
        return [];
      }

      // Fetch all complaints
      const complaints: ProductQualityComplaint[] = [];
      for (const refId of referenceIds) {
        const complaint = await this.getProductQualityComplaint(refId);
        if (complaint) {
          complaints.push(complaint);
        }
      }

      return complaints;
    } catch (error) {
      console.error('Failed to get complaints:', error);
      return [];
    }
  }

  /**
   * Get Product Quality Complaint Count
   * 
   * @returns Total number of complaints stored
   */
  async getProductQualityComplaintCount(): Promise<number> {
    try {
      return await this.redis.llen(this.PQ_LIST_KEY);
    } catch (error) {
      console.error('Failed to count complaints:', error);
      return 0;
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