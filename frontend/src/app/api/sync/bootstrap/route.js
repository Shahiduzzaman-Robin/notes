import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Note from '@/models/Note';
import Board from '@/models/Board';
import Folder from '@/models/Folder';
import Task from '@/models/Task';
import Transaction from '@/models/Transaction';

export async function GET(req) {
  console.log('🚀 Bootstrap API started');
  try {
    const user = await verifyAuth(req);
    if (!user) {
      console.warn('⚠️ Bootstrap failed: Not authorized');
      return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
    }

    console.log(`👤 Fetching data for user: ${user.email}`);
    await dbConnect();

    // Fetch all data in parallel
    console.log('📦 Querying all collections...');
    const [notes, boards, folders, tasks, transactions] = await Promise.all([
      Note.find({ user: user._id }).sort({ updatedAt: -1 }).lean(),
      Board.find({ user: user._id }).sort({ updatedAt: -1 }).lean(),
      Folder.find({ user: user._id }).sort({ updatedAt: -1 }).lean(),
      Task.find({ user: user._id }).lean(),
      Transaction.find({ user: user._id }).sort({ date: -1 }).select('+details').lean()
    ]);

    console.log(`✅ Success: Found ${notes.length} notes, ${boards.length} boards, ${folders.length} folders, ${tasks.length} tasks, ${transactions.length} transactions`);

    return NextResponse.json({
      notes,
      boards,
      folders,
      tasks,
      transactions
    });
  } catch (error) {
    console.error('❌ FATAL Bootstrap API error:', error.message);
    return NextResponse.json({ 
      message: 'Database sync failed', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}
