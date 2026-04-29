import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/db/mongodb';
import { verifyAuth } from '../../../lib/db/auth';
import Note from '../../../models/Note';

export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = params;
    const updates = await req.json();

    await dbConnect();
    const updatedNote = await Note.findOneAndUpdate(
      { _id: id, user: user._id },
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updatedNote) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(updatedNote);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = params;

    await dbConnect();
    const deletedNote = await Note.findOneAndDelete({ _id: id, user: user._id });

    if (!deletedNote) {
      return NextResponse.json({ message: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Note deleted successfully' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
