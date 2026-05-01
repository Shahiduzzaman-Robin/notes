import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Board from '@/models/Board';
import Task from '@/models/Task';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    await dbConnect();

    const board = await Board.findOne({ shareSlug: slug, isPublic: true })
      .select('name columns updatedAt createdAt -_id');

    if (!board) {
      return NextResponse.json({ message: 'Public board not found or sharing is disabled' }, { status: 404 });
    }

    // Fetch tasks for this public board
    // Note: We need to be careful here. Task schema needs to be checked if it can be filtered by boardId easily
    // Since we don't have the original _id of the board in the public response, 
    // we need to use the board's internal ID to fetch tasks but not expose it.
    
    const internalBoard = await Board.findOne({ shareSlug: slug, isPublic: true });
    const tasks = await Task.find({ boardId: internalBoard._id })
      .select('content columnId order updatedAt createdAt -_id');

    return NextResponse.json({
      board,
      tasks
    });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
