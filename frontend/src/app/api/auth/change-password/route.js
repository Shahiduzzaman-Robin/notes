import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import User from '@/models/User';

export async function PUT(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();

    await dbConnect();
    const dbUser = await User.findById(user._id);

    if (dbUser && (await dbUser.matchPassword(currentPassword))) {
      dbUser.password = newPassword;
      await dbUser.save();
      return NextResponse.json({ message: 'Password updated successfully' });
    } else {
      return NextResponse.json({ message: 'Invalid current password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Change Password API error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
