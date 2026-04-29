import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Board from '@/models/Board';

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { name, folderId } = await req.json();
    
    const board = await Board.create({
      name: name || 'New Board',
      folder: folderId || null,
      user: user._id,
      columns: [
        { id: 'todo', title: 'To Do', order: 0 },
        { id: 'in-progress', title: 'In Progress', order: 1 },
        { id: 'done', title: 'Done', order: 2 }
      ]
    });

    return NextResponse.json(board, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  // Update board (e.g. rename or move folder)
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { id, name, folder } = await req.json();
    
    const updatedBoard = await Board.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: { name, folder } },
      { returnDocument: 'after' }
    );

    return NextResponse.json(updatedBoard);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
