import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Task from '@/models/Task';

// GET tasks for a specific board
export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get('boardId');

    if (!boardId) return NextResponse.json({ message: 'Board ID is required' }, { status: 400 });

    await dbConnect();
    const tasks = await Task.find({ board: boardId, user: user._id }).sort({ order: 1 });

    return NextResponse.json(tasks);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// POST (Create) a task
export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const data = await req.json();
    
    // Map frontend fields to schema fields
    const { 
      content, 
      title, 
      boardId, 
      board, 
      columnId, 
      order 
    } = data;

    await dbConnect();
    
    const taskCount = await Task.countDocuments({ 
      board: boardId || board, 
      columnId: columnId || 'todo' 
    });

    const task = await Task.create({
      title: title || content || 'New Task',
      board: boardId || board,
      columnId: columnId || 'todo',
      user: user._id,
      order: order !== undefined ? order : taskCount,
      priority: 'none'
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
