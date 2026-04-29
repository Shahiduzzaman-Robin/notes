export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Task from '@/models/Task';

// PUT (Update) a task
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;
    const updates = await req.json();

    await dbConnect();
    const task = await Task.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: updates },
      { new: true }
    );

    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 });

    return NextResponse.json(task);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a task
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    await dbConnect();
    const task = await Task.findOneAndDelete({ _id: id, user: user._id });

    if (!task) return NextResponse.json({ message: 'Task not found' }, { status: 404 });

    return NextResponse.json({ message: 'Task removed' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
