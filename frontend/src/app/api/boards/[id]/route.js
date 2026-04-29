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
    const { name, folderId } = await req.json();

    await dbConnect();
    const board = await Board.findOneAndUpdate(
      { _id: id, user: user._id },
      { name, folder: folderId },
      { new: true }
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
