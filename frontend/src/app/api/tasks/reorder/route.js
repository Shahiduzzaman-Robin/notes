export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Task from '@/models/Task';

export async function PUT(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { tasks } = await req.json();

    await dbConnect();
    
    // Perform bulk update for reordering
    const bulkOps = tasks.map((task) => ({
      updateOne: {
        filter: { _id: task.id, user: user._id },
        update: { $set: { columnId: task.columnId, order: task.order } }
      }
    }));

    await Task.bulkWrite(bulkOps);

    return NextResponse.json({ message: 'Tasks reordered successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
