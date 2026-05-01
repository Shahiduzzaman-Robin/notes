export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Board from '@/models/Board';

// PUT (Update) a board
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;
    const updates = await req.json();

    // If sharing is being turned on and no slug exists, generate one
    if (updates.isPublic && !updates.shareSlug) {
      const { crypto } = await import('crypto');
      updates.shareSlug = crypto.randomBytes(5).toString('hex');
    }

    await dbConnect();
    const board = await Board.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!board) return NextResponse.json({ message: 'Board not found' }, { status: 404 });

    return NextResponse.json(board);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a board
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    await dbConnect();
    const board = await Board.findOneAndDelete({ _id: id, user: user._id });

    if (!board) return NextResponse.json({ message: 'Board not found' }, { status: 404 });

    return NextResponse.json({ message: 'Board removed' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
