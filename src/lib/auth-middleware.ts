import { NextRequest } from 'next/server';
import { verifyUserToken } from './actions';
import { extractTokenFromHeader } from './jwt';
import type { User } from './types';

export interface AuthenticatedRequest extends NextRequest {
  user?: User;
}

export async function authenticateRequest(request: NextRequest): Promise<{ user: User | null; error?: string }> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return { user: null, error: "No token provided" };
    }

    // Verify token and get user
    const user = await verifyUserToken(token);
    
    if (!user) {
      return { user: null, error: "Invalid or expired token" };
    }

    return { user };
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return { user: null, error: "Authentication failed" };
  }
}

export function requireAuth(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error || "Authentication required" 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add user to request object
    (request as AuthenticatedRequest).user = user;
    
    return handler(request as AuthenticatedRequest);
  };
}

export function requireAdmin(handler: (request: AuthenticatedRequest) => Promise<Response>) {
  return async (request: NextRequest): Promise<Response> => {
    const { user, error } = await authenticateRequest(request);
    
    if (!user) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: error || "Authentication required" 
        }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (user.role !== 'admin') {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Admin access required" 
        }),
        { 
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Add user to request object
    (request as AuthenticatedRequest).user = user;
    
    return handler(request as AuthenticatedRequest);
  };
}
