import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { verifyAuth } from '@/lib/db/auth';
import Folder from '@/models/Folder';

// PUT (Update) a folder
export async function PUT(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;
    const { name, color, icon } = await req.json();

    await dbConnect();
    const folder = await Folder.findOneAndUpdate(
      { _id: id, user: user._id },
      { name, color, icon },
      { new: true }
    );

    if (!folder) return NextResponse.json({ message: 'Folder not found' }, { status: 404 });

    return NextResponse.json(folder);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

// DELETE a folder
export async function DELETE(req, { params }) {
  try {
    const user = await verifyAuth(req);
    if (!user) return NextResponse.json({ message: 'Not authorized' }, { status: 401 });

    const { id } = await params;

    await dbConnect();
    const folder = await Folder.findOneAndDelete({ _id: id, user: user._id });

    if (!folder) return NextResponse.json({ message: 'Folder not found' }, { status: 404 });

    return NextResponse.json({ message: 'Folder removed' });
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
