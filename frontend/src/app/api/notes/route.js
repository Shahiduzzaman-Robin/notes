import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Note from '@/models/Note';

export async function GET(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const notes = await Note.find({ user: user._id }).sort({ updatedAt: -1 });
    return NextResponse.json(notes);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    await dbConnect();
    const { title, content, folder } = await req.json();
    
    const note = await Note.create({
      title: title || 'Untitled Note',
      content: content || '',
      folder: folder || null,
      user: user._id
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
