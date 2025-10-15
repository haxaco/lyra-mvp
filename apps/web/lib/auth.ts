/**
 * Authentication helpers for server-side operations
 * Resolves user and organization context for RLS and audit
 */

import { getOrgClientAndId } from './org';
import { env } from './env';
import { UnauthorizedError } from './types';

export interface UserAndOrg {
  userId: string;
  organizationId: string;
  user: any; // Supabase user object
}

/**
 * Get current user and organization context
 * @returns User and organization information
 * @throws UnauthorizedError if no valid session or membership
 */
export async function getUserAndOrg(): Promise<UserAndOrg> {
  // Debug mode: use environment overrides if available
  if (env.DEBUG_USER_ID && env.DEBUG_ORG_ID) {
    console.warn('⚠️  DEBUG MODE: Using environment user/org overrides. Remove in production!');
    return {
      userId: env.DEBUG_USER_ID,
      organizationId: env.DEBUG_ORG_ID,
      user: { id: env.DEBUG_USER_ID }, // Minimal user object for debug mode
    };
  }

  try {
    const { supa, orgId, userId } = await getOrgClientAndId();
    
    if (!userId) {
      throw new UnauthorizedError('No authenticated user found');
    }
    
    if (!orgId) {
      throw new UnauthorizedError('User is not a member of any organization');
    }
    
    // Get full user object for additional context
    const { data: { user }, error } = await supa.auth.getUser();
    if (error || !user) {
      throw new UnauthorizedError('Failed to get user details');
    }
    
    return {
      userId,
      organizationId: orgId,
      user,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      throw error;
    }
    
    // Wrap other errors as unauthorized to avoid leaking internal details
    throw new UnauthorizedError('Authentication failed');
  }
}

/**
 * Validate that a user has access to a specific organization
 * @param userId - The user ID to validate
 * @param organizationId - The organization ID to check access for
 * @returns True if user has access, false otherwise
 */
export async function validateOrgAccess(userId: string, organizationId: string): Promise<boolean> {
  try {
    const { supa } = await getOrgClientAndId();
    
    const { data, error } = await supa
      .from('user_memberships')
      .select('organization_id')
      .eq('user_id', userId)
      .eq('organization_id', organizationId)
      .single();
      
    return !error && !!data;
  } catch {
    return false;
  }
}

/**
 * Get organization ID for a user (first membership)
 * @param userId - The user ID
 * @returns Organization ID or null if no membership
 */
export async function getUserOrganizationId(userId: string): Promise<string | null> {
  try {
    const { supa } = await getOrgClientAndId();
    
    const { data, error } = await supa
      .from('user_memberships')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .single();
      
    if (error) return null;
    return data?.organization_id || null;
  } catch {
    return null;
  }
}

// Re-export the UnauthorizedError for convenience
export { UnauthorizedError } from './types';
