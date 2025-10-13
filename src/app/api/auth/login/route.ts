import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/actions';
import { z } from 'zod';

const LoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    const validation = LoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request data",
          details: validation.error.errors 
        },
        { status: 400 }
      );
    }

    const { email, password } = validation.data;

    // Authenticate user
    const result = await authenticateUser(email, password);
    
    if (!result) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid email or password" 
        },
        { status: 401 }
      );
    }

    // Return user data and token
    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        fullName: result.user.fullName,
        email: result.user.email,
        role: result.user.role,
      },
      token: result.token,
    });

  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
