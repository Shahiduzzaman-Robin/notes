import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Task from '@/models/Task';

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { content, boardId, columnId } = await req.json();
    
    const taskCount = await Task.countDocuments({ boardId, columnId });

    const task = await Task.create({
      content: content || '',
      boardId,
      columnId: columnId || 'todo',
      user: user._id,
      order: taskCount
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { id, updates } = await req.json();
    
    const updatedTask = await Task.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: updates },
      { returnDocument: 'after' }
    );

    return NextResponse.json(updatedTask);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
