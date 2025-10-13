import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/actions';
import { extractTokenFromHeader } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);
    
    if (!token) {
      return NextResponse.json(
        { 
          success: false, 
          error: "No token provided" 
        },
        { status: 401 }
      );
    }

    // Verify token and get user
    const user = await verifyUserToken(token);
    
    if (!user) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid or expired token" 
        },
        { status: 401 }
      );
    }

    // Return user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Token verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
