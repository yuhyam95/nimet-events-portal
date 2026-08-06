import { NextRequest, NextResponse } from 'next/server';
import { requireSuperAdmin } from '@/lib/auth-middleware';
import { getUsers, updateUserRole } from '@/lib/actions';

async function handleGetScannerAdmins(request: NextRequest) {
  try {
    const users = await getUsers();
    const scannerAdmins = users.filter((u: any) => u.role === 'scan_admin');
    return NextResponse.json({ success: true, scannerAdmins });
  } catch (error) {
    console.error('Get scanner admins error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

async function handleAssignScannerAdmin(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action } = body;

    if (!userId || !['promote', 'demote'].includes(action)) {
      return NextResponse.json(
        { success: false, error: 'userId and action (promote | demote) are required' },
        { status: 400 }
      );
    }

    const newRole = action === 'promote' ? 'scan_admin' : 'user';
    const result = await updateUserRole(userId, newRole);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update user role' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: action === 'promote'
        ? 'User has been promoted to Scanner Administrator.'
        : 'User has been demoted back to standard User.',
      user: result.user
    });
  } catch (error) {
    console.error('Assign scanner admin error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}

// Only Super Admin can manage scanner admin assignments
export const GET = requireSuperAdmin(handleGetScannerAdmins);
export const POST = requireSuperAdmin(handleAssignScannerAdmin);
