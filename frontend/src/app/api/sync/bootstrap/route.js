import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db/mongodb';
import { verifyAuth } from '../../../lib/db/auth';
import Note from '../../../models/Note';
import Board from '../../../models/Board';
import Folder from '../../../models/Folder';
import Task from '../../../models/Task';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) {
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    await dbConnect();

    // Fetch all data in parallel for maximum speed
    const [notes, boards, folders, tasks] = await Promise.all([
      Note.find({ user: user._id }).sort({ updatedAt: -1 }),
      Board.find({ user: user._id }).sort({ updatedAt: -1 }),
      Folder.find({ user: user._id }).sort({ updatedAt: -1 }),
      Task.find({ user: user._id })
    ]);

    return NextResponse.json({
      notes,
      boards,
      folders,
      tasks
    });
  } catch (error) {
    console.error('Bootstrap API error:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
