import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Note from '@/models/Note';

export async function GET(req, { params }) {
  try {
    const { slug } = await params;
    await dbConnect();

    const note = await Note.findOne({ shareSlug: slug, isPublic: true })
      .select('title content updatedAt createdAt -_id'); // Only select public fields

    if (!note) {
      return NextResponse.json({ message: 'Public note not found or sharing is disabled' }, { status: 404 });
    }

    return NextResponse.json(note);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
