import { NextRequest, NextResponse } from 'next/server';
import { verifyUserToken } from '@/lib/actions';
import { extractTokenFromHeader } from '@/lib/jwt';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
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

    // Verify current token and get user
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

    // Generate new token
    const newToken = generateToken(user);

    // Return new token and user data
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
      token: newToken,
    });

  } catch (error) {
    console.error('Token refresh API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
